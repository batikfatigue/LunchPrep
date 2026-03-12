import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
    getStoredTheme,
    setStoredTheme,
    resolveTheme,
    applyTheme,
    STORAGE_KEY,
} from "@/lib/theme";

// happy-dom provides localStorage and matchMedia stubs in the test environment.

beforeEach(() => {
    localStorage.clear();
    // Reset the dark class between tests.
    document.documentElement.classList.remove("dark");
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getStoredTheme
// ---------------------------------------------------------------------------

describe("getStoredTheme", () => {
    it("returns 'system' when localStorage is empty (happy path)", () => {
        expect(getStoredTheme()).toBe("system");
    });

    it("returns 'light' when stored preference is 'light'", () => {
        localStorage.setItem(STORAGE_KEY, "light");
        expect(getStoredTheme()).toBe("light");
    });

    it("returns 'dark' when stored preference is 'dark'", () => {
        localStorage.setItem(STORAGE_KEY, "dark");
        expect(getStoredTheme()).toBe("dark");
    });

    it("returns 'system' when stored preference is 'system'", () => {
        localStorage.setItem(STORAGE_KEY, "system");
        expect(getStoredTheme()).toBe("system");
    });

    it("returns 'system' for an invalid stored value (edge case)", () => {
        localStorage.setItem(STORAGE_KEY, "banana");
        expect(getStoredTheme()).toBe("system");
    });

    it("returns 'system' when localStorage throws (failure case)", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("localStorage unavailable");
        });
        expect(getStoredTheme()).toBe("system");
    });
});

// ---------------------------------------------------------------------------
// setStoredTheme
// ---------------------------------------------------------------------------

describe("setStoredTheme", () => {
    it("writes the theme to localStorage (happy path)", () => {
        setStoredTheme("dark");
        expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });

    it("overwrites an existing value", () => {
        localStorage.setItem(STORAGE_KEY, "light");
        setStoredTheme("system");
        expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
    });

    it("is a no-op when localStorage throws (failure case)", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("localStorage unavailable");
        });
        // Should not throw.
        expect(() => setStoredTheme("dark")).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// resolveTheme
// ---------------------------------------------------------------------------

describe("resolveTheme", () => {
    it("resolves 'light' preference to 'light' (happy path)", () => {
        expect(resolveTheme("light")).toBe("light");
    });

    it("resolves 'dark' preference to 'dark'", () => {
        expect(resolveTheme("dark")).toBe("dark");
    });

    it("resolves 'system' to 'dark' when OS prefers dark", () => {
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as MediaQueryList);
        expect(resolveTheme("system")).toBe("dark");
    });

    it("resolves 'system' to 'light' when OS prefers light (edge case)", () => {
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as MediaQueryList);
        expect(resolveTheme("system")).toBe("light");
    });

    it("falls back to 'light' when matchMedia throws (failure case)", () => {
        vi.spyOn(window, "matchMedia").mockImplementation(() => {
            throw new Error("matchMedia unavailable");
        });
        expect(resolveTheme("system")).toBe("light");
    });
});

// ---------------------------------------------------------------------------
// applyTheme
// ---------------------------------------------------------------------------

describe("applyTheme", () => {
    it("adds the 'dark' class when effective theme is 'dark' (happy path)", () => {
        applyTheme("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes the 'dark' class when effective theme is 'light'", () => {
        document.documentElement.classList.add("dark");
        applyTheme("light");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("is idempotent when 'dark' class is already present (edge case)", () => {
        document.documentElement.classList.add("dark");
        applyTheme("dark");
        // classList.add is idempotent — no duplicate class.
        expect(document.documentElement.className.split(" ").filter(c => c === "dark")).toHaveLength(1);
    });
});
