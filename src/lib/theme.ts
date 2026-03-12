/**
 * Theme utility module.
 *
 * Manages user theme preferences (light / dark / system) via localStorage,
 * resolves the effective theme using the OS media query, and applies the
 * `dark` class to the document root.
 *
 * All functions guard against environments where `localStorage` or
 * `window.matchMedia` may be unavailable (SSR, private browsing, tests).
 */

/** localStorage key used to persist the user's theme preference. */
export const STORAGE_KEY = "lunchprep-theme";

/** The three possible user-facing theme preferences. */
export type Theme = "light" | "dark" | "system";

/** The two resolved, effective themes used to apply the CSS class. */
export type EffectiveTheme = "light" | "dark";

/** The ordered cycle: light → dark → system → light. */
export const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

/**
 * Read the user's stored theme preference from localStorage.
 *
 * @returns The stored `Theme`, or `"system"` if absent / unavailable.
 */
export function getStoredTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
            return stored;
        }
    } catch {
        // Reason: localStorage may throw in private browsing or restricted environments.
    }
    return "system";
}

/**
 * Persist the user's theme preference to localStorage.
 * No-op if localStorage is unavailable.
 *
 * @param {Theme} theme - The preference to store.
 */
export function setStoredTheme(theme: Theme): void {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Reason: Silent no-op — the toggle still works for the session even if persistence fails.
    }
}

/**
 * Resolve a user preference to a concrete `light` or `dark` effective theme.
 * When preference is `"system"`, delegates to the OS `prefers-color-scheme` media query.
 *
 * @param {Theme} preference - The user's stored preference.
 * @returns {EffectiveTheme} The resolved effective theme.
 */
export function resolveTheme(preference: Theme): EffectiveTheme {
    if (preference === "light") return "light";
    if (preference === "dark") return "dark";
    // Reason: "system" delegates to OS preference. Guard for SSR / test environments.
    try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    } catch {
        return "light";
    }
}

/**
 * Apply the effective theme to the document by toggling the `dark` class
 * on `<html>`. shadcn/ui and Tailwind's `@custom-variant dark` both rely on this.
 *
 * @param {EffectiveTheme} effective - The resolved theme to apply.
 */
export function applyTheme(effective: EffectiveTheme): void {
    const root = document.documentElement;
    if (effective === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}
