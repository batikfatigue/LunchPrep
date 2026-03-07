"use client";

/**
 * Generic localStorage synchronisation hook.
 *
 * Reads the initial value from localStorage (SSR-safe lazy initialiser),
 * and writes back to localStorage via a useEffect whenever the value changes.
 *
 * @module use-local-storage
 */

import { useState, useEffect } from "react";

/**
 * Synchronise a React state value with a localStorage key.
 *
 * Reads the initial value from localStorage on mount. Falls back to
 * `initialValue` when the key is absent or the stored JSON is malformed.
 * Guards against SSR environments where `window` is unavailable.
 *
 * @template T - The type of the stored value (must be JSON-serialisable).
 * @param key - localStorage key to read/write.
 * @param initialValue - Value to use when the key is absent or unreadable.
 * @returns A stateful tuple `[value, setValue]` — identical API to useState.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // Lazy initialiser: runs once on mount, reads from localStorage.
  // Reason: Using a function here avoids reading localStorage on every render;
  // it also allows SSR environments to return initialValue without errors.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      // Reason: Malformed JSON or blocked localStorage access should never
      // crash the app — silently fall back to the provided initial value.
      return initialValue;
    }
  });

  // Write to localStorage whenever the value changes.
  // Reason: useEffect keeps this SSR-safe and separates reads (lazy init)
  // from writes (effect), matching the pattern used in categories.ts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore storage quota errors or other write failures.
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
