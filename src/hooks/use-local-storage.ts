"use client";

/**
 * Generic localStorage synchronisation hook.
 *
 * Always renders with `initialValue` on the first paint (SSR + hydration safe),
 * then reads the real value from localStorage in a client-side effect. Writes
 * back to localStorage whenever the value changes after hydration.
 *
 * @module use-local-storage
 */

import { useState, useEffect, useRef } from "react";

/**
 * Synchronise a React state value with a localStorage key.
 *
 * The first render always uses `initialValue` to avoid SSR/hydration
 * mismatches. After mount, the stored value is read from localStorage
 * and applied via a state update.
 *
 * @template T - The type of the stored value (must be JSON-serialisable).
 * @param key - localStorage key to read/write.
 * @param initialValue - Value to use during SSR and before localStorage is read.
 * @returns A stateful tuple `[value, setValue]` — identical API to useState.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isHydrated = useRef(false);

  // Reason: Read from localStorage after hydration to avoid SSR mismatch.
  // This runs once on mount and replaces the initial value with the stored one.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // Reason: Malformed JSON or blocked localStorage access should never
      // crash the app — silently fall back to the provided initial value.
    }
    isHydrated.current = true;
  }, [key]);

  // Write to localStorage whenever the value changes (only after hydration).
  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore storage quota errors or other write failures.
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
