/**
 * Session persistence utilities for the LunchPrep review workflow.
 *
 * Serialises and deserialises review-step state to/from a single
 * localStorage key (`lunchprep_session`). Handles:
 *   - Map ↔ Array<[K, V]> conversion for `categoryMap`
 *   - Date string → Date rehydration for `RawTransaction.date`
 *   - Version validation (discard stale sessions on schema changes)
 *
 * @module session
 */

import type { RawTransaction } from "@/lib/parsers/types";
import type { CategorisationStatus } from "@/components/transaction-table";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_KEY = "lunchprep_session";

/**
 * Increment when `SavedSession` shape changes in a breaking way.
 * Stored sessions with a different version will be discarded on restore.
 */
export const SESSION_VERSION = 1;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Session metadata shown in the resume banner.
 */
export interface SessionMeta {
  /** Original CSV filename (e.g. "dbs_mar2026.csv"). */
  filename: string;
  /** Number of transactions in the session. */
  txnCount: number;
  /** ISO 8601 timestamp of the last save. */
  savedAt: string;
}

/**
 * The full serialised session envelope stored under `lunchprep_session`.
 *
 * `categoryMap` is stored as entries array because `Map` is not JSON-serialisable.
 * `RawTransaction.date` is stored as an ISO 8601 string (JSON default).
 */
export interface SavedSession {
  /** Schema version — increment when shape changes. */
  version: number;
  /** Banner metadata. */
  meta: SessionMeta;
  /** Serialised page state. */
  state: {
    /** Transactions with `date` stored as ISO string. */
    transactions: RawTransaction[];
    /** categoryMap serialised as `Array.from(map.entries())`. */
    categoryMap: [number, string][];
    /** Only stored when "done". */
    catStatus: Extract<CategorisationStatus, "done">;
  };
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

/**
 * Serialise review-step state into a `SavedSession` JSON string.
 *
 * @param params.filename - Original CSV filename.
 * @param params.transactions - Parsed/restored transaction array.
 * @param params.categoryMap - Current category assignments.
 * @returns JSON string ready for localStorage.
 */
export function serialiseSession({
  filename,
  transactions,
  categoryMap,
}: {
  filename: string;
  transactions: RawTransaction[];
  categoryMap: Map<number, string>;
}): string {
  const session: SavedSession = {
    version: SESSION_VERSION,
    meta: {
      filename,
      txnCount: transactions.length,
      savedAt: new Date().toISOString(),
    },
    state: {
      // Reason: JSON.stringify converts Date to ISO string automatically.
      transactions,
      // Reason: Map is not JSON-serialisable; store as entries array.
      categoryMap: Array.from(categoryMap.entries()),
      catStatus: "done",
    },
  };
  return JSON.stringify(session);
}

// ---------------------------------------------------------------------------
// Deserialisation
// ---------------------------------------------------------------------------

/**
 * Deserialise a `SavedSession` from a raw JSON string.
 *
 * Returns `null` if the string is malformed, empty, or has a mismatched version.
 * Rehydrates `RawTransaction.date` from ISO string back to `Date` object.
 *
 * @param raw - Raw string from `localStorage.getItem`.
 * @returns Deserialised session, or null if invalid.
 */
export function deserialiseSession(raw: string | null): SavedSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedSession;
    // Reason: Discard sessions written by older/newer incompatible versions.
    if (parsed.version !== SESSION_VERSION) return null;

    // Rehydrate Date objects — JSON.parse delivers them as strings.
    const transactions: RawTransaction[] = parsed.state.transactions.map(
      (tx) => ({
        ...tx,
        // Reason: `date` is the only Date field on RawTransaction.
        date: new Date(tx.date as unknown as string),
      }),
    );

    return {
      ...parsed,
      state: {
        ...parsed.state,
        transactions,
        // Reason: Restore Map from entries array.
        categoryMap: parsed.state.categoryMap,
      },
    };
  } catch {
    // Reason: Malformed JSON should never crash the app — silently discard.
    return null;
  }
}

/**
 * Restore a `categoryMap` from a deserialised session's entries array.
 *
 * @param entries - Category map entries from `SavedSession.state.categoryMap`.
 * @returns Reconstructed `Map<number, string>`.
 */
export function restoreCategoryMap(
  entries: [number, string][],
): Map<number, string> {
  return new Map(entries);
}
