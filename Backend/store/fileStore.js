import fs from "node:fs/promises";
import path from "node:path";

/**
 * Zero-dependency fallback store. Threads live in memory and are flushed to a
 * JSON file so the app survives restarts without anyone installing MongoDB.
 */
export async function createFileStore(dataDir) {
    const file = path.resolve(dataDir, "threads.json");
    const threads = new Map();

    await fs.mkdir(path.dirname(file), {recursive: true});

    try {
        const raw = await fs.readFile(file, "utf8");
        for (const thread of JSON.parse(raw)) threads.set(thread.threadId, thread);
    } catch (err) {
        if (err.code !== "ENOENT") console.warn(`Could not read ${file}, starting empty:`, err.message);
    }

    // Writes are serialised through one promise chain so concurrent requests
    // can never interleave and truncate the file.
    let writeQueue = Promise.resolve();
    const flush = () => {
        writeQueue = writeQueue
            .then(() => fs.writeFile(file, JSON.stringify([...threads.values()], null, 2)))
            .catch((err) => console.error("Failed to persist threads:", err.message));
        return writeQueue;
    };

    const summarise = (thread) => ({
        threadId: thread.threadId,
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messageCount: thread.messages.length
    });

    return {
        kind: "file",
        describe: () => `JSON file (${path.relative(process.cwd(), file)})`,

        async listThreads() {
            return [...threads.values()]
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map(summarise);
        },

        async getThread(threadId) {
            return threads.get(threadId) ?? null;
        },

        async getMessages(threadId) {
            return threads.get(threadId)?.messages ?? null;
        },

        async appendMessages(threadId, messages, {title} = {}) {
            const now = new Date().toISOString();
            let thread = threads.get(threadId);

            if (!thread) {
                thread = {threadId, title: title || "New chat", messages: [], createdAt: now, updatedAt: now};
                threads.set(threadId, thread);
            }

            thread.messages.push(...messages);
            if (title) thread.title = title;
            thread.updatedAt = now;

            await flush();
            return summarise(thread);
        },

        async replaceMessages(threadId, messages) {
            const thread = threads.get(threadId);
            if (!thread) return null;

            thread.messages = messages;
            thread.updatedAt = new Date().toISOString();

            await flush();
            return summarise(thread);
        },

        async renameThread(threadId, title) {
            const thread = threads.get(threadId);
            if (!thread) return null;

            thread.title = title;
            thread.updatedAt = new Date().toISOString();

            await flush();
            return summarise(thread);
        },

        async deleteThread(threadId) {
            const existed = threads.delete(threadId);
            if (existed) await flush();
            return existed;
        },

        async close() {
            await writeQueue;
        }
    };
}
