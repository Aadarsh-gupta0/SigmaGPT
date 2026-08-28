import mongoose from "mongoose";
import Thread from "../models/Thread.js";

const summarise = (thread) => ({
    threadId: thread.threadId,
    title: thread.title,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    messageCount: thread.messages?.length ?? 0
});

export async function createMongoStore(uri) {
    await mongoose.connect(uri, {serverSelectionTimeoutMS: 5000});

    return {
        kind: "mongodb",
        describe: () => "MongoDB",

        async listThreads() {
            const threads = await Thread.find({}, {messages: {$slice: 0}}).sort({updatedAt: -1}).lean();
            return threads.map(summarise);
        },

        async getThread(threadId) {
            return Thread.findOne({threadId}).lean();
        },

        async getMessages(threadId) {
            const thread = await Thread.findOne({threadId}, {messages: 1}).lean();
            return thread?.messages ?? null;
        },

        async appendMessages(threadId, messages, {title} = {}) {
            const now = new Date();
            const existing = await Thread.findOne({threadId});

            if (!existing) {
                const created = await Thread.create({
                    threadId,
                    title: title || "New chat",
                    messages,
                    createdAt: now,
                    updatedAt: now
                });
                return summarise(created);
            }

            existing.messages.push(...messages);
            if (title) existing.title = title;
            existing.updatedAt = now;
            await existing.save();
            return summarise(existing);
        },

        async replaceMessages(threadId, messages) {
            const updated = await Thread.findOneAndUpdate(
                {threadId},
                {$set: {messages, updatedAt: new Date()}},
                {new: true}
            );
            return updated ? summarise(updated) : null;
        },

        async renameThread(threadId, title) {
            const updated = await Thread.findOneAndUpdate(
                {threadId},
                {$set: {title, updatedAt: new Date()}},
                {new: true}
            );
            return updated ? summarise(updated) : null;
        },

        async deleteThread(threadId) {
            const deleted = await Thread.findOneAndDelete({threadId});
            return Boolean(deleted);
        },

        async close() {
            await mongoose.disconnect();
        }
    };
}
