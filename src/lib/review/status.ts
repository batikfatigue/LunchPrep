/**
 * Review-step derived state: per-transaction review status, filtering,
 * searching, sorting and display formatting.
 *
 * All functions here are pure so the review UI stays declarative and the
 * behaviour is unit-testable without rendering React.
 */

import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-transaction review state shown in the AI column and filter chips. */
export type ReviewStatus = "categorised" | "needs-review" | "uncategorised";

/** Filter chip selection above the review table. */
export type ReviewFilter = "all" | ReviewStatus;

/** Sort direction for the date column. */
export type SortDirection = "asc" | "desc";

/** A transaction paired with its absolute index in the unfiltered array. */
export interface IndexedTransaction {
  index: number;
  transaction: RawTransaction;
}

/** Counts backing the filter chips. */
export interface StatusCounts {
  all: number;
  categorised: number;
  "needs-review": number;
  uncategorised: number;
}

// ---------------------------------------------------------------------------
// Status derivation
// ---------------------------------------------------------------------------

/**
 * Payee value written by the parser when no cleaner recognised the row format.
 * Such rows carry no usable merchant text, so any category is a guess.
 */
export const UNKNOWN_PAYEE = "Unknown Format";

/**
 * Category the model falls back to when it cannot place a transaction.
 * Treated as "needs review" rather than "categorised".
 */
export const FALLBACK_CATEGORY = "Other";

/**
 * Derive the review status of a single transaction.
 *
 * - `uncategorised` — no category assigned yet.
 * - `needs-review`  — a category exists but is low-confidence: the parser could
 *   not recognise the row format, the category is the model's catch-all, or the
 *   category is not part of the user's active category list.
 * - `categorised`   — a valid, specific category is assigned.
 *
 * @param transaction - The transaction to classify.
 * @param category - Currently assigned category, or undefined when unassigned.
 * @param categories - The user's active category list.
 * @returns The derived review status.
 */
export function deriveReviewStatus(
  transaction: RawTransaction,
  category: string | undefined,
  categories: string[],
): ReviewStatus {
  if (!category) return "uncategorised";
  if (transaction.description === UNKNOWN_PAYEE) return "needs-review";
  if (category === FALLBACK_CATEGORY) return "needs-review";
  if (!categories.includes(category)) return "needs-review";
  return "categorised";
}

/**
 * Count transactions per review status.
 *
 * @param transactions - All transactions in the review step.
 * @param categoryMap - Index → category assignments.
 * @param categories - The user's active category list.
 * @returns Counts for every filter chip, including the "all" total.
 */
export function countByStatus(
  transactions: RawTransaction[],
  categoryMap: ReadonlyMap<number, string>,
  categories: string[],
): StatusCounts {
  const counts: StatusCounts = {
    all: transactions.length,
    categorised: 0,
    "needs-review": 0,
    uncategorised: 0,
  };

  transactions.forEach((tx, i) => {
    counts[deriveReviewStatus(tx, categoryMap.get(i), categories)] += 1;
  });

  return counts;
}

// ---------------------------------------------------------------------------
// Filtering, searching and sorting
// ---------------------------------------------------------------------------

/**
 * Test whether a transaction matches a free-text search query.
 *
 * Matches (case-insensitively) against payee, notes, the raw bank description
 * and the formatted absolute amount, so `32.40` finds a `-32.40` row.
 *
 * @param transaction - Transaction to test.
 * @param query - Raw search box value. Blank queries match everything.
 * @returns True when the transaction should be shown.
 */
export function matchesSearch(transaction: RawTransaction, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    transaction.description,
    transaction.notes,
    transaction.originalDescription,
    Math.abs(transaction.amount).toFixed(2),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

/**
 * Apply the active filter chip, search query and date sort to the transaction
 * list, preserving each transaction's absolute index.
 *
 * The absolute index is what `categoryMap` and every edit callback key off, so
 * it must survive filtering and sorting.
 *
 * @param transactions - All transactions in the review step.
 * @param categoryMap - Index → category assignments.
 * @param categories - The user's active category list.
 * @param filter - Active filter chip.
 * @param query - Search box value.
 * @param sort - Date sort direction.
 * @returns Visible transactions paired with their absolute indices.
 */
export function selectVisibleTransactions(
  transactions: RawTransaction[],
  categoryMap: ReadonlyMap<number, string>,
  categories: string[],
  filter: ReviewFilter,
  query: string,
  sort: SortDirection,
): IndexedTransaction[] {
  const visible: IndexedTransaction[] = [];

  transactions.forEach((transaction, index) => {
    if (
      filter !== "all" &&
      deriveReviewStatus(transaction, categoryMap.get(index), categories) !== filter
    ) {
      return;
    }
    if (!matchesSearch(transaction, query)) return;
    visible.push({ index, transaction });
  });

  // Reason: index is the tiebreaker so rows sharing a date keep a stable order.
  visible.sort((a, b) => {
    const delta = a.transaction.date.getTime() - b.transaction.date.getTime();
    if (delta !== 0) return sort === "asc" ? delta : -delta;
    return a.index - b.index;
  });

  return visible;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format a signed amount for the table: thousands separators, two decimals,
 * and a leading minus for debits.
 *
 * @param amount - Signed amount (negative = debit).
 * @returns e.g. `-32.40` or `2,800.00`.
 */
export function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format an amount as Singapore dollars for summary tiles.
 *
 * @param amount - Signed amount.
 * @returns e.g. `S$3,284.16` or `-S$120.00`.
 */
export function formatCurrency(amount: number): string {
  return `${amount < 0 ? "-" : ""}S$${Math.abs(amount).toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a transaction date as `Sep 14, 2024`.
 *
 * @param date - Transaction date.
 * @returns Locale-independent short date string.
 */
export function formatTableDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
