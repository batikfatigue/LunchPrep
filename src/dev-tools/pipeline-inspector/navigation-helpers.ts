/**
 * Navigation helper functions for the Pipeline Inspector.
 *
 * Pure functions for finding the next/previous unreviewed or flagged
 * transaction index with wrap-around semantics. All functions return
 * `null` when no matching transaction exists.
 *
 * Dev-tool only — never imported outside src/dev-tools/.
 */

import type { ReviewStatus } from "@/dev-tools/pipeline-inspector/review-controls";

// ---------------------------------------------------------------------------
// Unreviewed navigation
// ---------------------------------------------------------------------------

/**
 * Determines whether a transaction is unreviewed.
 *
 * A transaction is unreviewed when it is absent from the reviewMap,
 * or has no "ok" or "flagged" status (i.e. "neutral" also counts as unreviewed
 * for navigation purposes since the user hasn't actively reviewed it).
 *
 * @param index - The 0-indexed transaction index to check.
 * @param reviewMap - The current review state map.
 * @returns True if the transaction has no active review status.
 */
function isUnreviewed(index: number, reviewMap: ReadonlyMap<number, ReviewStatus>): boolean {
    const entry = reviewMap.get(index);
    return !entry || (entry.status !== "ok" && entry.status !== "flagged");
}

/**
 * Find the next unreviewed transaction index after `currentIndex`, with wrap-around.
 *
 * Starts searching at `currentIndex + 1` and wraps back to `0` if needed.
 * Returns `null` if no unreviewed transaction exists (other than the current one).
 *
 * @param currentIndex - The currently selected 0-indexed transaction index.
 * @param transactionCount - Total number of transactions.
 * @param reviewMap - The current review state map.
 * @returns The 0-indexed index of the next unreviewed transaction, or null.
 */
export function findNextUnreviewed(
    currentIndex: number,
    transactionCount: number,
    reviewMap: ReadonlyMap<number, ReviewStatus>,
): number | null {
    for (let i = 1; i < transactionCount; i++) {
        const candidate = (currentIndex + i) % transactionCount;
        if (isUnreviewed(candidate, reviewMap)) {
            return candidate;
        }
    }
    return null;
}

/**
 * Find the previous unreviewed transaction index before `currentIndex`, with wrap-around.
 *
 * Starts searching at `currentIndex - 1` and wraps back to the end if needed.
 * Returns `null` if no unreviewed transaction exists (other than the current one).
 *
 * @param currentIndex - The currently selected 0-indexed transaction index.
 * @param transactionCount - Total number of transactions.
 * @param reviewMap - The current review state map.
 * @returns The 0-indexed index of the previous unreviewed transaction, or null.
 */
export function findPrevUnreviewed(
    currentIndex: number,
    transactionCount: number,
    reviewMap: ReadonlyMap<number, ReviewStatus>,
): number | null {
    for (let i = 1; i < transactionCount; i++) {
        const candidate = (currentIndex - i + transactionCount) % transactionCount;
        if (isUnreviewed(candidate, reviewMap)) {
            return candidate;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Flagged navigation
// ---------------------------------------------------------------------------

/**
 * Find the next flagged transaction index after `currentIndex`, with wrap-around.
 *
 * Starts searching at `currentIndex + 1` and wraps back to `0` if needed.
 * Returns `null` if no flagged transaction exists.
 *
 * @param currentIndex - The currently selected 0-indexed transaction index.
 * @param transactionCount - Total number of transactions.
 * @param reviewMap - The current review state map.
 * @returns The 0-indexed index of the next flagged transaction, or null.
 */
export function findNextFlagged(
    currentIndex: number,
    transactionCount: number,
    reviewMap: ReadonlyMap<number, ReviewStatus>,
): number | null {
    for (let i = 1; i < transactionCount; i++) {
        const candidate = (currentIndex + i) % transactionCount;
        const entry = reviewMap.get(candidate);
        if (entry?.status === "flagged") {
            return candidate;
        }
    }
    return null;
}

/**
 * Find the previous flagged transaction index before `currentIndex`, with wrap-around.
 *
 * Starts searching at `currentIndex - 1` and wraps back to the end if needed.
 * Returns `null` if no flagged transaction exists.
 *
 * @param currentIndex - The currently selected 0-indexed transaction index.
 * @param transactionCount - Total number of transactions.
 * @param reviewMap - The current review state map.
 * @returns The 0-indexed index of the previous flagged transaction, or null.
 */
export function findPrevFlagged(
    currentIndex: number,
    transactionCount: number,
    reviewMap: ReadonlyMap<number, ReviewStatus>,
): number | null {
    for (let i = 1; i < transactionCount; i++) {
        const candidate = (currentIndex - i + transactionCount) % transactionCount;
        const entry = reviewMap.get(candidate);
        if (entry?.status === "flagged") {
            return candidate;
        }
    }
    return null;
}
