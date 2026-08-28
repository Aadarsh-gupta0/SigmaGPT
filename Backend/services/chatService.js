import config from "../config/index.js";
import {getStore} from "../store/index.js";
import {resolveOrder} from "../providers/index.js";

/** Derives a readable thread title from the opening message. */
export function deriveTitle(message) {
    const flat = message.replace(/\s+/g, " ").trim();
    if (flat.length <= 48) return flat || "New chat";

    const cut = flat.slice(0, 48);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * The prompt sent upstream: a system instruction plus the tail of the thread.
 * The original implementation forwarded only the newest message, so the model
 * had no memory of the conversation.
 */
function buildPrompt(history) {
    return [
        {role: "system", content: config.systemPrompt},
        ...history.slice(-config.historyLimit).map(({role, content}) => ({role, content}))
    ];
}

const isAbort = (err) => err?.name === "AbortError" || err?.code === "ABORT_ERR";

/**
 * Streams an answer, walking the provider fallback chain. A provider that
 * fails before producing any text is skipped; one that fails mid-answer keeps
 * whatever it already streamed.
 *
 * Yields: {type: "meta"|"delta"|"done"|"error", ...}
 */
export async function* streamAnswer({threadId, message, providerId, regenerate = false, signal}) {
    const store = getStore();
    const existing = (await store.getMessages(threadId)) ?? [];

    let history = [...existing];
    let title;

    if (regenerate) {
        // Re-answer the last user turn: drop trailing assistant replies.
        while (history.length && history[history.length - 1].role === "assistant") history.pop();
        if (!history.length) throw new Error("Nothing to regenerate in this thread");
        await store.replaceMessages(threadId, history);
    } else {
        const userMessage = {role: "user", content: message, createdAt: new Date().toISOString()};
        history.push(userMessage);
        title = existing.length ? undefined : deriveTitle(message);
        await store.appendMessages(threadId, [userMessage], {title});
    }

    const prompt = buildPrompt(history);
    const chain = resolveOrder(providerId);
    const failures = [];

    for (const provider of chain) {
        let answer = "";

        try {
            yield {type: "meta", provider: provider.id, providerLabel: provider.label, model: provider.model, title};

            for await (const delta of provider.stream(prompt, {signal})) {
                answer += delta;
                yield {type: "delta", text: delta};
            }

            if (!answer.trim() && !signal?.aborted) {
                throw new Error(`${provider.label} returned an empty response`);
            }
        } catch (err) {
            if (isAbort(err)) {
                // Client hung up or pressed stop — keep the partial answer.
                if (answer.trim()) {
                    await persist(store, threadId, answer, provider);
                    yield {type: "done", content: answer, provider: provider.id, model: provider.model, stopped: true};
                }
                return;
            }

            failures.push(`${provider.label}: ${err.message}`);

            if (answer.trim()) {
                await persist(store, threadId, answer, provider);
                yield {type: "done", content: answer, provider: provider.id, model: provider.model, truncated: true};
                return;
            }

            console.warn(`Provider ${provider.id} failed, trying next:`, err.message);
            continue;
        }

        await persist(store, threadId, answer, provider);
        yield {type: "done", content: answer, provider: provider.id, model: provider.model};
        return;
    }

    yield {
        type: "error",
        message: [
            "No free provider could answer this request.",
            failures.join(" | "),
            "Tip: add a free GROQ_API_KEY or GEMINI_API_KEY to Backend/.env for a reliable provider."
        ].join(" ")
    };
}

async function persist(store, threadId, content, provider) {
    await store.appendMessages(threadId, [
        {
            role: "assistant",
            content,
            provider: provider.id,
            model: provider.model,
            createdAt: new Date().toISOString()
        }
    ]);
}

/** Non-streaming convenience wrapper around the same pipeline. */
export async function completeAnswer(options) {
    let content = "";
    let meta = {};

    for await (const event of streamAnswer(options)) {
        if (event.type === "meta") meta = {provider: event.provider, model: event.model, title: event.title};
        if (event.type === "delta") content += event.text;
        if (event.type === "done") return {reply: event.content, ...meta};
        if (event.type === "error") throw new Error(event.message);
    }

    return {reply: content, ...meta};
}
