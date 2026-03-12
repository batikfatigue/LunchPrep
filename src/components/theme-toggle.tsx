"use client";

/**
 * ThemeToggle — cycles through light / dark / system themes.
 *
 * On click, the theme cycles: light → dark → system → light.
 * The selected preference is persisted to localStorage and applied
 * immediately by toggling the `dark` class on `<html>`.
 *
 * Also listens for OS-level `prefers-color-scheme` changes and re-applies
 * the theme in real time when the stored preference is "system".
 */

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    getStoredTheme,
    setStoredTheme,
    resolveTheme,
    applyTheme,
    THEME_CYCLE,
    type Theme,
} from "@/lib/theme";

/** Icon and label for each theme state. */
const THEME_META: Record<Theme, { icon: React.ReactNode; label: string }> = {
    light: { icon: <Sun className="size-4" />, label: "Switch to dark mode" },
    dark: { icon: <Moon className="size-4" />, label: "Switch to system theme" },
    system: {
        icon: <Monitor className="size-4" />,
        label: "Switch to light mode",
    },
};

/**
 * Icon button that cycles the app theme and persists the user's preference.
 *
 * @returns A React element rendering the theme toggle button.
 */
export function ThemeToggle() {
    // Initialise with "system" to avoid a localStorage read during SSR.
    // The real value is read on mount in the effect below.
    const [preference, setPreference] = React.useState<Theme>("system");

    // Task 3.5: On mount, sync state from localStorage.
    React.useEffect(() => {
        setPreference(getStoredTheme());
    }, []);

    // Tasks 4.1–4.3: Listen for OS preference changes; re-apply when set to "system".
    React.useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");

        /**
         * Re-resolve and apply the theme when the OS preference changes.
         * Only has a visible effect when the stored preference is "system".
         */
        function handleChange() {
            const current = getStoredTheme();
            if (current === "system") {
                applyTheme(resolveTheme("system"));
                // Force React re-render so the icon stays in sync.
                setPreference("system");
            }
        }

        mq.addEventListener("change", handleChange);
        // Task 4.3: Clean up listener on unmount.
        return () => mq.removeEventListener("change", handleChange);
    }, []);

    /**
     * Advance to the next theme in the cycle, persist and apply it.
     * Tasks 3.2, 3.4.
     */
    function handleClick() {
        const currentIndex = THEME_CYCLE.indexOf(preference);
        const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
        setStoredTheme(next);
        applyTheme(resolveTheme(next));
        setPreference(next);
    }

    const { icon, label } = THEME_META[preference];

    return (
        <Button
            id="theme-toggle"
            variant="ghost"
            size="icon"
            onClick={handleClick}
            aria-label={label}
            title={label}
        >
            {icon}
        </Button>
    );
}
