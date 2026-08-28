import config from "../config/index.js";
import {fetchWithTimeout, readServerSentEvents, toProviderError} from "../lib/http.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Google's free tier speaks its own dialect: a `systemInstruction`, `model`
 * instead of `assistant`, and content split into parts.
 */
function toGeminiPayload(messages) {
    const systemTurns = messages.filter((m) => m.role === "system");
    const chatTurns = messages.filter((m) => m.role !== "system");

    return {
        ...(systemTurns.length
            ? {systemInstruction: {parts: [{text: systemTurns.map((m) => m.content).join("\n\n")}]}}
            : {}),
        contents: chatTurns.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{text: message.content}]
        })),
        generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens
        }
    };
}

const textFrom = (candidate) =>
    (candidate?.content?.parts ?? [])
        .map((part) => part?.text ?? "")
        .join("");

export function createGeminiProvider({apiKey, model}) {
    const headers = () => ({
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
    });

    return {
        id: "gemini",
        label: "Google Gemini",
        description: "Google AI Studio free tier — fast, long context, generous daily quota.",
        docsUrl: "https://aistudio.google.com/apikey",
        model,
        requiresKey: true,
        keyEnv: "GEMINI_API_KEY",
        local: false,
        isConfigured: () => Boolean(apiKey),

        async *stream(messages, {signal} = {}) {
            const response = await fetchWithTimeout(
                `${BASE}/${model}:streamGenerateContent?alt=sse`,
                {method: "POST", headers: headers(), body: JSON.stringify(toGeminiPayload(messages))},
                {timeoutMs: config.requestTimeoutMs, signal}
            );

            if (!response.ok || !response.body) throw await toProviderError(response, "Google Gemini");

            for await (const event of readServerSentEvents(response)) {
                const delta = textFrom(event?.candidates?.[0]);
                if (delta) yield delta;
            }
        },

        async complete(messages, {signal} = {}) {
            const response = await fetchWithTimeout(
                `${BASE}/${model}:generateContent`,
                {method: "POST", headers: headers(), body: JSON.stringify(toGeminiPayload(messages))},
                {timeoutMs: config.requestTimeoutMs, signal}
            );

            if (!response.ok) throw await toProviderError(response, "Google Gemini");

            const data = await response.json();
            return textFrom(data?.candidates?.[0]);
        }
    };
}
