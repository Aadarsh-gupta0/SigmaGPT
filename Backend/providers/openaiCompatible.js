import config from "../config/index.js";
import {fetchWithTimeout, readServerSentEvents, toProviderError} from "../lib/http.js";

/**
 * Most free providers speak the OpenAI /chat/completions dialect, so they all
 * share this adapter. Only the endpoint, model and auth header differ.
 */
export function createOpenAICompatibleProvider({
    id,
    label,
    description,
    docsUrl,
    endpoint,
    model,
    apiKey = "",
    requiresKey = false,
    keyEnv = "",
    extraHeaders = {},
    local = false
}) {
    const headers = () => ({
        "Content-Type": "application/json",
        ...(apiKey ? {Authorization: `Bearer ${apiKey}`} : {}),
        ...extraHeaders
    });

    const body = (messages, stream) =>
        JSON.stringify({
            model,
            messages,
            stream,
            temperature: config.temperature,
            max_tokens: config.maxTokens
        });

    return {
        id,
        label,
        description,
        docsUrl,
        model,
        requiresKey,
        keyEnv,
        local,
        isConfigured: () => (requiresKey ? Boolean(apiKey) : true),

        async *stream(messages, {signal} = {}) {
            const response = await fetchWithTimeout(
                endpoint,
                {method: "POST", headers: headers(), body: body(messages, true)},
                {timeoutMs: config.requestTimeoutMs, signal}
            );

            if (!response.ok || !response.body) throw await toProviderError(response, label);

            for await (const event of readServerSentEvents(response)) {
                const delta = event?.choices?.[0]?.delta?.content;
                if (delta) yield delta;
            }
        },

        async complete(messages, {signal} = {}) {
            const response = await fetchWithTimeout(
                endpoint,
                {method: "POST", headers: headers(), body: body(messages, false)},
                {timeoutMs: config.requestTimeoutMs, signal}
            );

            if (!response.ok) throw await toProviderError(response, label);

            const data = await response.json();
            return data?.choices?.[0]?.message?.content ?? "";
        }
    };
}
