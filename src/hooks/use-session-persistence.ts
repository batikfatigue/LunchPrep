"use client";

/**
 * Session persistence hook for the LunchPrep review workflow.
 *
 * Reads the saved session from localStorage on mount and writes the current
 * review state back on a trailing debounce (~1 second) whenever the caller
 * passes updated state.
 *
 * Only persists when `catStatus === "done"` to avoid saving incomplete runs.
 *
 * @module use-session-persistence
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { RawTransaction } from "@/lib/parsers/types";
import type { CategorisationStatus } from "@/components/transaction-table";
import {
  SESSION_KEY,
  serialiseSession,
  deserialiseSession,
  restoreCategoryMap,
  type SavedSession,
} from "@/lib/session";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Input state for the persistence hook.
 * Omit catStatus and only pass data when it makes sense to persist.
 */
export interface SessionState {
  filename: string;
  transactions: RawTransaction[];
  categoryMap: Map<number, string>;
  catStatus: CategorisationStatus;
}

/**
 * Restored session values returned from `restore()`.
 */
export interface RestoredSession {
  transactions: RawTransaction[];
  categoryMap: Map<number, string>;
}

/**
 * Return value of `useSessionPersistence`.
 */
export interface SessionPersistenceResult {
  /** The saved session metadata, or null if no valid session exists. */
  savedSession: SavedSession | null;
  /**
   * Restore state from the saved session.
   * Returns the hydrated state for the caller to apply to their own state.
   */
  restore: () => RestoredSession | null;
  /** Clear the saved session from localStorage and clear local state. */
  discard: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 1000;

/**
 * Manage session persistence for the review workflow.
 *
 * On mount, reads `localStorage["lunchprep_session"]` and exposes any valid
 * saved session. Whenever `state` changes and `catStatus === "done"`, writes
 * the serialised session to localStorage after a ~1s trailing debounce.
 *
 * @param state - Current page state to persist (pass null to skip writes).
 * @returns `{ savedSession, restore, discard }`
 */
export function useSessionPersistence(
  state: SessionState | null,
): SessionPersistenceResult {
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Reason: Track whether we've hydrated from localStorage to avoid
  // overwriting storage on the first render before we've had a chance to read.
  const isHydrated = useRef(false);

  // Read from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      const session = deserialiseSession(raw);
      setSavedSession(session);
    } catch {
      // Reason: Any storage access error should never crash the app.
    }
    isHydrated.current = true;
  }, []);

  // Debounced write when state changes (only after hydration, only when done).
  useEffect(() => {
    if (!isHydrated.current) return;
    if (!state || state.catStatus !== "done") return;

    // Reason: Clear any pending debounce so only the last call in a burst writes.
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      try {
        const json = serialiseSession({
          filename: state.filename,
          transactions: state.transactions,
          categoryMap: state.categoryMap,
        });
        window.localStorage.setItem(SESSION_KEY, json);
        // Reason: Update in-memory savedSession so the banner reflects latest state.
        setSavedSession(deserialiseSession(json));
      } catch {
        // Reason: localStorage quota errors or access errors must not crash the app.
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
    // Reason: Depend on the identity of all state fields that affect the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.filename, state?.transactions, state?.categoryMap, state?.catStatus]);

  /** Restore from saved session, returning hydrated values. */
  const restore = useCallback((): RestoredSession | null => {
    if (!savedSession) return null;
    return {
      transactions: savedSession.state.transactions,
      categoryMap: restoreCategoryMap(savedSession.state.categoryMap),
    };
  }, [savedSession]);

  /** Remove the saved session from localStorage and clear local state. */
  const discard = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage access errors.
    }
    setSavedSession(null);
  }, []);

  return { savedSession, restore, discard };
}
