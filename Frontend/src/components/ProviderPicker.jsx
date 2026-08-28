import {useEffect, useRef, useState} from "react";
import {useChat} from "../context/useChat.js";
import {ChevronIcon} from "./Icons.jsx";
import "./ProviderPicker.css";

export default function ProviderPicker() {
    const {providerInfo, preferredProvider, setPreferredProvider} = useChat();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKeyDown = (event) => event.key === "Escape" && setOpen(false);

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const {providers, active} = providerInfo;
    const selected = providers.find((p) => p.id === (preferredProvider || active));

    const choose = (id) => {
        setPreferredProvider(id);
        setOpen(false);
    };

    return (
        <div className="picker" ref={rootRef}>
            <button className="pickerTrigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                <span className="pickerLabel">{selected?.label ?? "No provider"}</span>
                <span className="pickerModel">{selected?.model}</span>
                <ChevronIcon size={15} />
            </button>

            {open && (
                <div className="pickerMenu" role="listbox">
                    <p className="pickerHeading">Answer provider</p>

                    <button
                        className={`pickerItem${preferredProvider ? "" : " pickerItem--selected"}`}
                        onClick={() => choose("")}
                    >
                        <span className="pickerItemTop">
                            <strong>Automatic</strong>
                            <span className="pickerBadge pickerBadge--ok">recommended</span>
                        </span>
                        <span className="pickerItemDesc">
                            Uses the first configured provider and falls back if it fails.
                        </span>
                    </button>

                    {providers.map((provider) => (
                        <button
                            key={provider.id}
                            className={`pickerItem${preferredProvider === provider.id ? " pickerItem--selected" : ""}`}
                            onClick={() => choose(provider.id)}
                            disabled={!provider.ready}
                        >
                            <span className="pickerItemTop">
                                <strong>{provider.label}</strong>
                                {provider.ready ? (
                                    <span className="pickerModelTag">{provider.model}</span>
                                ) : (
                                    <span className="pickerBadge">needs {provider.keyEnv}</span>
                                )}
                            </span>
                            <span className="pickerItemDesc">{provider.description}</span>
                        </button>
                    ))}

                    <p className="pickerFoot">
                        Every provider here is free. Add keys in <code>Backend/.env</code>.
                    </p>
                </div>
            )}
        </div>
    );
}
