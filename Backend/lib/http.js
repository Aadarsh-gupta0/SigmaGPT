/**
 * Small fetch helpers shared by every provider adapter.
 */

export class ProviderError extends Error {
    constructor(message, {provider, status, cause} = {}) {
        super(message);
        this.name = "ProviderError";
        this.provider = provider;
        this.status = status;
        this.cause = cause;
    }
}

/**
 * fetch() with a timeout that also honours a caller-supplied AbortSignal, so a
 * client disconnect cancels the upstream request too.
 *
 * The composed signal stays attached for the lifetime of the response body, not
 * just the headers — otherwise a streamed answer could never be cancelled.
 */
export async function fetchWithTimeout(url, options = {}, {timeoutMs = 120000, signal} = {}) {
    const timeout = AbortSignal.timeout(timeoutMs);
    // A timeout aborts with TimeoutError and a disconnect with AbortError, which
    // is how callers tell "try the next provider" apart from "the user stopped".
    const composed = signal ? AbortSignal.any([signal, timeout]) : timeout;

    return fetch(url, {...options, signal: composed});
}

/** Reads a response body and yields one trimmed line at a time. */
export async function* readLines(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});

            let newline;
            while ((newline = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, newline).trim();
                buffer = buffer.slice(newline + 1);
                if (line) yield line;
            }
        }
    } finally {
        reader.releaseLock();
    }

    const tail = buffer.trim();
    if (tail) yield tail;
}

/** Yields the JSON payload of every `data:` line in an SSE stream, skipping `[DONE]`. */
export async function* readServerSentEvents(response) {
    for await (const line of readLines(response)) {
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        try {
            yield JSON.parse(payload);
        } catch {
            // Some gateways emit keep-alive comments or partial frames; ignore them.
        }
    }
}

/** Turns a failed upstream response into a ProviderError with a readable message. */
export async function toProviderError(response, provider) {
    let detail = "";

    try {
        const body = await response.text();
        try {
            const parsed = JSON.parse(body);
            detail = parsed?.error?.message || parsed?.message || body;
        } catch {
            detail = body;
        }
    } catch {
        // body already consumed or unreadable
    }

    const trimmed = detail.slice(0, 300).trim();
    return new ProviderError(
        `${provider} responded ${response.status}${trimmed ? `: ${trimmed}` : ""}`,
        {provider, status: response.status}
    );
}
