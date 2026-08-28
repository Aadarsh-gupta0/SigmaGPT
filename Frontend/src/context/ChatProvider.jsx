import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {v4 as uuid} from "uuid";
import * as api from "../lib/api.js";
import {ChatContext} from "./ChatContext.js";

export function ChatProvider({children}) {
    const [threads, setThreads] = useState([]);
    const [threadId, setThreadId] = useState(() => uuid());
    const [messages, setMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);

    const [draft, setDraft] = useState("");
    const [streaming, setStreaming] = useState(null); // {text, provider, model}
    const [toast, setToast] = useState(null);

    const [providerInfo, setProviderInfo] = useState({providers: [], active: null, fallbackChain: []});
    const [preferredProvider, setPreferredProvider] = useState(
        () => localStorage.getItem("sigmagpt:provider") || ""
    );

    const abortRef = useRef(null);

    const notify = useCallback((message, tone = "error") => {
        setToast({message, tone, id: Date.now()});
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);

    const refreshThreads = useCallback(async () => {
        try {
            setThreads(await api.listThreads());
        } catch (err) {
            notify(`Could not load chat history: ${err.message}`);
        }
    }, [notify]);

    useEffect(() => {
        refreshThreads();

        api.getProviders()
            .then(setProviderInfo)
            .catch(() => notify("Could not reach the SigmaGPT API. Is the backend running?"));
    }, [refreshThreads, notify]);

    useEffect(() => {
        if (preferredProvider) localStorage.setItem("sigmagpt:provider", preferredProvider);
        else localStorage.removeItem("sigmagpt:provider");
    }, [preferredProvider]);

    const stop = useCallback(() => abortRef.current?.abort(), []);

    const newChat = useCallback(() => {
        stop();
        setThreadId(uuid());
        setMessages([]);
        setDraft("");
        setStreaming(null);
    }, [stop]);

    const openThread = useCallback(
        async (id) => {
            if (id === threadId) return;

            stop();
            setThreadId(id);
            setStreaming(null);
            setLoadingThread(true);

            try {
                setMessages(await api.getMessages(id));
            } catch (err) {
                notify(`Could not open that chat: ${err.message}`);
                setMessages([]);
            } finally {
                setLoadingThread(false);
            }
        },
        [threadId, stop, notify]
    );

    /** Shared by send() and regenerate(): drives one streamed answer. */
    const run = useCallback(
        async ({message, regenerate}) => {
            setStreaming({text: "", provider: null, model: null});

            // Mirrored outside React state so the abort path can still read it.
            let answer = "";
            let source = {provider: null, model: null};
            let committed = false;

            const commit = (content) => {
                if (committed || !content.trim()) return;
                committed = true;

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content,
                        provider: source.provider,
                        model: source.model,
                        createdAt: new Date().toISOString()
                    }
                ]);
            };

            const {controller, done} = api.streamChat(
                {threadId, message, provider: preferredProvider || undefined, regenerate},
                (event) => {
                    if (event.type === "meta") {
                        source = {provider: event.provider, model: event.model};
                        setStreaming((s) => (s ? {...s, ...source} : s));
                    }

                    if (event.type === "delta") {
                        answer += event.text;
                        setStreaming((s) => (s ? {...s, text: s.text + event.text} : s));
                    }

                    if (event.type === "done") {
                        source = {provider: event.provider, model: event.model};
                        commit(event.content);
                        setStreaming(null);
                    }

                    if (event.type === "error") {
                        setStreaming(null);
                        notify(event.message);
                    }
                }
            );

            abortRef.current = controller;

            try {
                await done;
            } catch (err) {
                // On stop the server keeps the partial answer, so the UI must too
                // — otherwise the text vanishes now and returns on reload.
                if (err.name === "AbortError") commit(answer);
                else notify(err.message);
            } finally {
                abortRef.current = null;
                setStreaming(null);
                refreshThreads();
            }
        },
        [threadId, preferredProvider, notify, refreshThreads]
    );

    const send = useCallback(
        async (raw) => {
            const message = (raw ?? draft).trim();
            if (!message || streaming) return;

            setDraft("");
            setMessages((prev) => [
                ...prev,
                {role: "user", content: message, createdAt: new Date().toISOString()}
            ]);

            await run({message, regenerate: false});
        },
        [draft, streaming, run]
    );

    const regenerate = useCallback(async () => {
        if (streaming) return;

        // Mirror the backend: the last assistant turn is replaced.
        setMessages((prev) => {
            const next = [...prev];
            while (next.length && next[next.length - 1].role === "assistant") next.pop();
            return next;
        });

        await run({message: "", regenerate: true});
    }, [streaming, run]);

    const removeThread = useCallback(
        async (id) => {
            try {
                await api.deleteThread(id);
                setThreads((prev) => prev.filter((thread) => thread.threadId !== id));
                if (id === threadId) newChat();
            } catch (err) {
                notify(`Could not delete that chat: ${err.message}`);
            }
        },
        [threadId, newChat, notify]
    );

    const rename = useCallback(
        async (id, title) => {
            const trimmed = title.trim();
            if (!trimmed) return;

            const previous = threads;
            setThreads((prev) =>
                prev.map((thread) => (thread.threadId === id ? {...thread, title: trimmed} : thread))
            );

            try {
                await api.renameThread(id, trimmed);
            } catch (err) {
                setThreads(previous);
                notify(`Could not rename that chat: ${err.message}`);
            }
        },
        [threads, notify]
    );

    const value = useMemo(
        () => ({
            threads,
            threadId,
            messages,
            loadingThread,
            draft,
            setDraft,
            streaming,
            isStreaming: Boolean(streaming),
            toast,
            dismissToast,
            providerInfo,
            preferredProvider,
            setPreferredProvider,
            send,
            stop,
            regenerate,
            newChat,
            openThread,
            removeThread,
            rename
        }),
        [
            threads,
            threadId,
            messages,
            loadingThread,
            draft,
            streaming,
            toast,
            dismissToast,
            providerInfo,
            preferredProvider,
            send,
            stop,
            regenerate,
            newChat,
            openThread,
            removeThread,
            rename
        ]
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
