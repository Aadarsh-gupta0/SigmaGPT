import {useCallback, useEffect, useState} from "react";

const STORAGE_KEY = "sigmagpt:theme";

// index.html sets the initial theme before paint; this hook just reads it back.
const initialTheme = () => document.documentElement.dataset.theme || "dark";

export function useTheme() {
    const [theme, setTheme] = useState(initialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Private browsing — the theme simply won't persist.
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    }, []);

    return {theme, toggleTheme};
}
