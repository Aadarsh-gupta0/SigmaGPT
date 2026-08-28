import {useEffect, useRef} from "react";
import {useChat} from "../context/useChat.js";
import Message from "./Message.jsx";
import Composer from "./Composer.jsx";
import EmptyState from "./EmptyState.jsx";
import ProviderPicker from "./ProviderPicker.jsx";
import {MenuIcon, SunIcon, MoonIcon} from "./Icons.jsx";
import "./ChatWindow.css";

function Thinking({provider}) {
    return (
        <div className="thinking">
            <span className="thinkingDots">
                <i />
                <i />
                <i />
            </span>
            {provider ? `${provider} is thinking…` : "Thinking…"}
        </div>
    );
}

export default function ChatWindow({onOpenMenu, theme, onToggleTheme}) {
    const {messages, streaming, isStreaming, loadingThread, regenerate, threadId} = useChat();
    const scrollRef = useRef(null);
    const pinnedRef = useRef(true);

    // Follow new content, but stop fighting the user if they scroll up.
    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };

    useEffect(() => {
        if (!pinnedRef.current) return;
        const el = scrollRef.current;
        el?.scrollTo({top: el.scrollHeight});
    }, [messages, streaming?.text]);

    useEffect(() => {
        pinnedRef.current = true;
        scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight});
    }, [threadId]);

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const isEmpty = messages.length === 0 && !isStreaming;

    return (
        <main className="chatWindow">
            <header className="topbar">
                <button className="iconBtn topbarMenu" onClick={onOpenMenu} aria-label="Open menu">
                    <MenuIcon />
                </button>

                <ProviderPicker />

                <button
                    className="iconBtn"
                    onClick={onToggleTheme}
                    aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                >
                    {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                </button>
            </header>

            <div className="scrollArea" ref={scrollRef} onScroll={onScroll}>
                <div className="thread">
                    {loadingThread ? (
                        <div className="threadLoading">Loading conversation…</div>
                    ) : isEmpty ? (
                        <EmptyState />
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <Message
                                    key={`${threadId}-${index}`}
                                    message={message}
                                    onRegenerate={
                                        !isStreaming && message === lastAssistant ? regenerate : undefined
                                    }
                                />
                            ))}

                            {isStreaming &&
                                (streaming.text ? (
                                    <Message
                                        message={{role: "assistant", content: streaming.text}}
                                        streaming
                                    />
                                ) : (
                                    <Thinking provider={streaming.provider} />
                                ))}
                        </>
                    )}
                </div>
            </div>

            <Composer />
        </main>
    );
}
