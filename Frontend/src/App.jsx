import {useEffect, useState} from "react";
import {ChatProvider} from "./context/ChatProvider.jsx";
import {useTheme} from "./hooks/useTheme.js";
import {useMediaQuery} from "./hooks/useMediaQuery.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import Toast from "./components/Toast.jsx";
import "./App.css";

export default function App() {
    const {theme, toggleTheme} = useTheme();
    const isMobile = useMediaQuery("(max-width: 880px)");
    const [menuOpen, setMenuOpen] = useState(false);

    // The drawer only exists on small screens.
    useEffect(() => {
        if (!isMobile) setMenuOpen(false);
    }, [isMobile]);

    return (
        <ChatProvider>
            <div className="app">
                <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

                {isMobile && menuOpen && (
                    <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                )}

                <ChatWindow
                    onOpenMenu={() => setMenuOpen(true)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />

                <Toast />
            </div>
        </ChatProvider>
    );
}
