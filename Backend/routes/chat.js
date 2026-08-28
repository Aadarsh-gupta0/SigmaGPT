import express from "express";
import {getStore} from "../store/index.js";
import {describeProviders} from "../providers/index.js";
import {completeAnswer, streamAnswer} from "../services/chatService.js";

const router = express.Router();

const fail = (res, status, error) => res.status(status).json({error});

/** Which free providers exist, and which one will actually answer. */
router.get("/providers", (req, res) => {
    res.json(describeProviders());
});

router.get("/thread", async (req, res) => {
    try {
        res.json(await getStore().listThreads());
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to fetch threads");
    }
});

router.get("/thread/:threadId", async (req, res) => {
    try {
        const messages = await getStore().getMessages(req.params.threadId);
        if (!messages) return fail(res, 404, "Thread not found");
        res.json(messages);
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to fetch chat");
    }
});

router.patch("/thread/:threadId", async (req, res) => {
    const title = (req.body?.title ?? "").trim();
    if (!title) return fail(res, 400, "A title is required");

    try {
        const updated = await getStore().renameThread(req.params.threadId, title.slice(0, 120));
        if (!updated) return fail(res, 404, "Thread not found");
        res.json(updated);
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to rename thread");
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    try {
        const deleted = await getStore().deleteThread(req.params.threadId);
        if (!deleted) return fail(res, 404, "Thread not found");
        res.json({success: true});
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to delete thread");
    }
});

const readChatBody = (req) => {
    const {threadId, message = "", provider, regenerate = false} = req.body ?? {};
    if (!threadId) return {error: "threadId is required"};
    if (!regenerate && !message.trim()) return {error: "message is required"};
    return {threadId, message: message.trim(), providerId: provider, regenerate: Boolean(regenerate)};
};

/** Non-streaming answer — kept so simple clients and curl still work. */
router.post("/chat", async (req, res) => {
    const parsed = readChatBody(req);
    if (parsed.error) return fail(res, 400, parsed.error);

    try {
        res.json(await completeAnswer(parsed));
    } catch (err) {
        console.error(err);
        fail(res, 502, err.message || "Something went wrong");
    }
});

/** Streaming answer over Server-Sent Events. */
router.post("/chat/stream", async (req, res) => {
    const parsed = readChatBody(req);
    if (parsed.error) return fail(res, 400, parsed.error);

    res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
    });
    res.flushHeaders?.();

    const abort = new AbortController();
    res.on("close", () => abort.abort());

    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    try {
        // Breaking out of the loop would call the generator's .return() and kill
        // it before it can save a partial answer, so keep draining and just stop
        // writing once the client is gone. The abort makes that finish promptly.
        for await (const event of streamAnswer({...parsed, signal: abort.signal})) {
            if (!res.writableEnded) send(event);
        }
    } catch (err) {
        console.error(err);
        if (!res.writableEnded) send({type: "error", message: err.message || "Something went wrong"});
    } finally {
        if (!res.writableEnded) res.end();
    }
});

export default router;
