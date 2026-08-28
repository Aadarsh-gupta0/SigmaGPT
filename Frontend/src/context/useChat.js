import {useContext} from "react";
import {ChatContext} from "./ChatContext.js";

export function useChat() {
    const value = useContext(ChatContext);
    if (!value) throw new Error("useChat must be used inside <ChatProvider>");
    return value;
}
