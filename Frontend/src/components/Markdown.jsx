import {memo, useState} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {CopyIcon, CheckIcon} from "./Icons.jsx";
import "./Markdown.css";

/** Collects the raw source of a hast node — highlighting wraps it in spans. */
function textOf(node) {
    if (!node) return "";
    if (node.type === "text") return node.value;
    return (node.children ?? []).map(textOf).join("");
}

function languageOf(node) {
    const classes = node?.properties?.className ?? [];
    const match = classes.find((name) => String(name).startsWith("language-"));
    return match ? String(match).slice("language-".length) : "";
}

function CopyButton({value}) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            // Clipboard is unavailable over plain http on some browsers.
        }
    };

    return (
        <button className="codeCopy" onClick={copy} aria-label={copied ? "Copied" : "Copy code"}>
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

function CodeBlock({node, children}) {
    const codeNode = node?.children?.[0];
    const language = languageOf(codeNode);
    const source = textOf(codeNode);

    return (
        <figure className="codeBlock">
            <figcaption className="codeBar">
                <span className="codeLang">{language || "text"}</span>
                <CopyButton value={source} />
            </figcaption>
            <pre>{children}</pre>
        </figure>
    );
}

const components = {
    pre: CodeBlock,
    // Wide tables scroll inside their own container instead of the page.
    table: ({children}) => (
        <div className="tableScroll">
            <table>{children}</table>
        </div>
    ),
    a: ({children, ...props}) => (
        <a {...props} target="_blank" rel="noreferrer noopener">
            {children}
        </a>
    )
};

function Markdown({children}) {
    return (
        <div className="markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeHighlight, {detect: true, ignoreMissing: true}]]}
                components={components}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}

export default memo(Markdown);
