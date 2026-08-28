import {memo, useState} from "react";
import Markdown from "./Markdown.jsx";
import {SigmaMark, CopyIcon, CheckIcon, RefreshIcon} from "./Icons.jsx";
import "./Message.css";

function Actions({content, onRegenerate}) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            // Clipboard unavailable — nothing useful to show the user.
        }
    };

    return (
        <div className="msgActions">
            <button className="msgAction" onClick={copy}>
                {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                {copied ? "Copied" : "Copy"}
            </button>

            {onRegenerate && (
                <button className="msgAction" onClick={onRegenerate}>
                    <RefreshIcon size={14} />
                    Regenerate
                </button>
            )}
        </div>
    );
}

function Message({message, streaming = false, onRegenerate}) {
    if (message.role === "user") {
        return (
            <article className="msg msg--user">
                <div className="userBubble">{message.content}</div>
            </article>
        );
    }

    return (
        <article className={`msg msg--assistant${streaming ? " msg--streaming" : ""}`}>
            <div className="msgAvatar">
                <SigmaMark size={26} />
            </div>

            <div className="msgBody">
                <Markdown>{message.content}</Markdown>

                {!streaming && (
                    <>
                        {message.model && <p className="msgMeta">{message.model}</p>}
                        <Actions content={message.content} onRegenerate={onRegenerate} />
                    </>
                )}
            </div>
        </article>
    );
}

export default memo(Message);
