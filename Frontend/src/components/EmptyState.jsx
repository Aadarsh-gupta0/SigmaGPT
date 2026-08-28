import {useChat} from "../context/useChat.js";
import {SigmaMark, SparkIcon, AlertIcon} from "./Icons.jsx";
import "./EmptyState.css";

const PROMPTS = [
    {
        title: "Explain a concept",
        prompt: "Explain how JavaScript's event loop works, with a short annotated example."
    },
    {
        title: "Review some code",
        prompt: "Review this function for bugs and suggest a cleaner version:\n\n```js\n\n```"
    },
    {
        title: "Plan a project",
        prompt: "Help me plan a two-week roadmap for a small MERN side project. Ask me what it does first."
    },
    {
        title: "Draft something",
        prompt: "Write a concise, friendly release note for a new dark mode feature."
    }
];

export default function EmptyState() {
    const {send, providerInfo} = useChat();

    const active = providerInfo.providers.find((p) => p.id === providerInfo.active);
    // Only the keyless community gateway carries the rate-limit caveat.
    const showRateLimitHint = active?.id === "pollinations";

    return (
        <div className="empty">
            <div className="emptyMark">
                <SigmaMark size={54} />
            </div>

            <h1 className="emptyTitle">What can I help with?</h1>
            <p className="emptyLead">
                {active
                    ? `Running on ${active.label} — ${active.model}`
                    : "No answer provider is available right now."}
            </p>

            <div className="promptGrid">
                {PROMPTS.map((item) => (
                    <button key={item.title} className="promptCard" onClick={() => send(item.prompt)}>
                        <SparkIcon size={16} />
                        <span className="promptTitle">{item.title}</span>
                        <span className="promptText">{item.prompt.split("\n")[0]}</span>
                    </button>
                ))}
            </div>

            {showRateLimitHint && (
                <p className="emptyHint">
                    <AlertIcon size={14} />
                    The keyless provider is rate limited. Add a free{" "}
                    <code>GROQ_API_KEY</code> or <code>GEMINI_API_KEY</code> to{" "}
                    <code>Backend/.env</code> for reliable answers.
                </p>
            )}
        </div>
    );
}
