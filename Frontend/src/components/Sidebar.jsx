import {useMemo, useState} from "react";
import {useChat} from "../context/useChat.js";
import {groupThreads} from "../lib/format.js";
import {SigmaMark, PlusIcon, SearchIcon, TrashIcon, PencilIcon, CloseIcon} from "./Icons.jsx";
import "./Sidebar.css";

function ThreadRow({thread, active, onOpen, onRename, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(thread.title);
    const [confirming, setConfirming] = useState(false);

    const commit = () => {
        setEditing(false);
        if (title.trim() && title.trim() !== thread.title) onRename(thread.threadId, title);
        else setTitle(thread.title);
    };

    if (editing) {
        return (
            <li className="threadRow threadRow--editing">
                <input
                    className="threadRename"
                    value={title}
                    autoFocus
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") {
                            setTitle(thread.title);
                            setEditing(false);
                        }
                    }}
                    aria-label="Rename chat"
                />
            </li>
        );
    }

    return (
        <li className={`threadRow${active ? " threadRow--active" : ""}`}>
            <button className="threadOpen" onClick={() => onOpen(thread.threadId)} title={thread.title}>
                <span className="threadTitle">{thread.title}</span>
            </button>

            {confirming ? (
                <span className="threadConfirm">
                    <button className="threadConfirmYes" onClick={() => onDelete(thread.threadId)}>
                        Delete
                    </button>
                    <button className="threadConfirmNo" onClick={() => setConfirming(false)}>
                        <CloseIcon size={14} />
                        <span className="srOnly">Cancel</span>
                    </button>
                </span>
            ) : (
                <span className="threadActions">
                    <button className="threadAction" onClick={() => setEditing(true)} title="Rename">
                        <PencilIcon size={15} />
                        <span className="srOnly">Rename chat</span>
                    </button>
                    <button
                        className="threadAction threadAction--danger"
                        onClick={() => setConfirming(true)}
                        title="Delete"
                    >
                        <TrashIcon size={15} />
                        <span className="srOnly">Delete chat</span>
                    </button>
                </span>
            )}
        </li>
    );
}

export default function Sidebar({open, onClose}) {
    const {threads, threadId, newChat, openThread, removeThread, rename, providerInfo} = useChat();
    const [query, setQuery] = useState("");

    const groups = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const filtered = needle
            ? threads.filter((thread) => thread.title.toLowerCase().includes(needle))
            : threads;
        return groupThreads(filtered);
    }, [threads, query]);

    const activeProvider = providerInfo.providers.find((p) => p.id === providerInfo.active);

    const handleOpen = (id) => {
        openThread(id);
        onClose?.();
    };

    return (
        <aside className={`sidebar${open ? " sidebar--open" : ""}`} aria-label="Chat history">
            <header className="sidebarHead">
                <div className="brand">
                    <SigmaMark size={30} />
                    <div className="brandText">
                        <strong>SigmaGPT</strong>
                        <span>Open model chat</span>
                    </div>
                </div>

                <button className="railClose" onClick={onClose} aria-label="Close menu">
                    <CloseIcon />
                </button>
            </header>

            <button
                className="newChat"
                onClick={() => {
                    newChat();
                    onClose?.();
                }}
            >
                <PlusIcon size={17} />
                New chat
            </button>

            <div className="searchField">
                <SearchIcon size={16} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search chats"
                    aria-label="Search chats"
                />
            </div>

            <nav className="threadList">
                {groups.length === 0 && (
                    <p className="emptyHistory">
                        {threads.length ? "No chats match that search." : "Your conversations will appear here."}
                    </p>
                )}

                {groups.map(([bucket, items]) => (
                    <section key={bucket} className="threadGroup">
                        <h2 className="threadGroupTitle">{bucket}</h2>
                        <ul>
                            {items.map((thread) => (
                                <ThreadRow
                                    key={thread.threadId}
                                    thread={thread}
                                    active={thread.threadId === threadId}
                                    onOpen={handleOpen}
                                    onRename={rename}
                                    onDelete={removeThread}
                                />
                            ))}
                        </ul>
                    </section>
                ))}
            </nav>

            <footer className="sidebarFoot">
                <span className={`statusDot${activeProvider ? "" : " statusDot--down"}`} />
                <span className="statusText">
                    {activeProvider ? `Answering with ${activeProvider.label}` : "No provider available"}
                </span>
            </footer>
        </aside>
    );
}
