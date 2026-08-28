import {useEffect} from "react";
import {useChat} from "../context/useChat.js";
import {AlertIcon, CloseIcon} from "./Icons.jsx";
import "./Toast.css";

export default function Toast() {
    const {toast, dismissToast} = useChat();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(dismissToast, 9000);
        return () => clearTimeout(timer);
    }, [toast, dismissToast]);

    if (!toast) return null;

    return (
        <div className="toast" role="status">
            <AlertIcon size={17} />
            <p className="toastText">{toast.message}</p>
            <button className="toastClose" onClick={dismissToast} aria-label="Dismiss">
                <CloseIcon size={15} />
            </button>
        </div>
    );
}
