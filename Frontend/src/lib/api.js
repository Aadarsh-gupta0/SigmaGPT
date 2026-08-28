// Requests go to a relative /api path; Vite proxies it to the backend in dev.
const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request(path, options = {}) {
    const response = await fetch(`${BASE}${path}`, {
        headers: {"Content-Type": "application/json"},
        ...options
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
    return data;
}

export const listThreads = () => request("/thread");
export const getMessages = (threadId) => request(`/thread/${threadId}`);
export const getProviders = () => request("/providers");

export const renameThread = (threadId, title) =>
    request(`/thread/${threadId}`, {method: "PATCH", body: JSON.stringify({title})});

export const deleteThread = (threadId) => request(`/thread/${threadId}`, {method: "DELETE"});

/**
 * Streams an answer over SSE, invoking `onEvent` for every frame the backend
 * emits ({type: "meta" | "delta" | "done" | "error"}).
 * Returns the AbortController so the caller can implement a stop button.
 */
export function streamChat({threadId, message, provider, regenerate = false}, onEvent) {
    const controller = new AbortController();

    const run = async () => {
        const response = await fetch(`${BASE}/chat/stream`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({threadId, message, provider, regenerate}),
            signal: controller.signal
        });

        if (!response.ok || !response.body) {
            const detail = await response.json().catch(() => null);
            throw new Error(detail?.error || `Request failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, {stream: true});

            // SSE frames are separated by a blank line.
            let split;
            while ((split = buffer.indexOf("\n\n")) !== -1) {
                const frame = buffer.slice(0, split);
                buffer = buffer.slice(split + 2);

                const line = frame.split("\n").find((l) => l.startsWith("data:"));
                if (!line) continue;

                try {
                    onEvent(JSON.parse(line.slice(5).trim()));
                } catch {
                    // Ignore malformed frames rather than killing the stream.
                }
            }
        }
    };

    return {controller, done: run()};
}
