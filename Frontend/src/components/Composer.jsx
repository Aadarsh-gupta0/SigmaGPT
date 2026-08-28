import {useCallback, useEffect, useLayoutEffect, useRef} from "react";
import {useChat} from "../context/useChat.js";
import {SendIcon, StopIcon} from "./Icons.jsx";
import "./Composer.css";

const MAX_HEIGHT = 200;

export default function Composer() {
    const {draft, setDraft, send, stop, isStreaming, threadId} = useChat();
    const textareaRef = useRef(null);

    const resize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }, []);

    // Grow with the content, then scroll once it gets tall. useLayoutEffect so
    // the measurement happens after styles are committed but before paint.
    useLayoutEffect(resize, [draft, resize]);

    // Web fonts change the line box, so re-measure once they have loaded.
    useEffect(() => {
        document.fonts?.ready.then(resize);
    }, [resize]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, [threadId]);

    const onKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    const canSend = draft.trim().length > 0 && !isStreaming;

    return (
        <div className="composer">
            <form
                className="composerBox"
                onSubmit={(e) => {
                    e.preventDefault();
                    send();
                }}
            >
                <textarea
                    ref={textareaRef}
                    className="composerInput"
                    rows={1}
                    value={draft}
                    placeholder="Ask anything…"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    aria-label="Message"
                />

                {isStreaming ? (
                    <button type="button" className="composerBtn composerBtn--stop" onClick={stop}>
                        <StopIcon size={16} />
                        <span className="srOnly">Stop generating</span>
                    </button>
                ) : (
                    <button type="submit" className="composerBtn" disabled={!canSend}>
                        <SendIcon size={17} />
                        <span className="srOnly">Send message</span>
                    </button>
                )}
            </form>

            <p className="composerHint">
                <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line ·
                answers come from free open models, so check anything important.
            </p>
        </div>
    );
}
