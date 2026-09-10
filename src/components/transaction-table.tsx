"use client";

/**
 * Transaction review table with AI category assignment and inline editing.
 *
 * Owns the review step's view state — status filter, search query, date sort,
 * pagination and row selection — and renders the toolbar, table and pagination
 * around it. Transaction data itself is owned by the parent; every callback is
 * keyed by the transaction's absolute index so edits survive filtering,
 * sorting and paging.
 *
 * Overlay states driven by the parent:
 * - "loading"  — semi-transparent overlay with spinner while AI call is in-flight
 * - "error"    — error banner; all dropdowns remain editable for manual entry
 * - "idle"/"done" — normal interactive table
 */

import * as React from "react";
import { ArrowDown, ArrowUp, Lightbulb, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ReviewPagination } from "@/components/review/review-pagination";
import { ReviewToolbar } from "@/components/review/review-toolbar";
import { TransactionRow } from "@/components/review/transaction-row";
import {
  countByStatus,
  deriveReviewStatus,
  selectVisibleTransactions,
  type ReviewFilter,
  type SortDirection,
} from "@/lib/review/status";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Current state of the AI categorisation API call. */
export type CategorisationStatus = "idle" | "loading" | "done" | "error";

export interface TransactionTableProps {
  /** Parsed and PII-restored transactions to display. */
  transactions: RawTransaction[];
  /** Available category options for the dropdown. */
  categories: string[];
  /**
   * Map from transaction index (0-based) to the currently selected category.
   * The parent owns this state and passes it down.
   */
  categoryMap: ReadonlyMap<number, string>;
  /** Status of the AI categorisation call controlling overlay rendering. */
  status: CategorisationStatus;
  /**
   * Callback fired when the user changes a category dropdown.
   *
   * @param index - 0-based transaction index.
   * @param category - Newly selected category string.
   */
  onCategoryChange: (index: number, category: string) => void;
  /**
   * Optional callback fired when the user edits a payee name inline.
   *
   * @param index - 0-based transaction index.
   * @param payee - Updated payee string.
   */
  onPayeeChange?: (index: number, payee: string) => void;
  /**
   * Optional callback fired when the user edits notes inline.
   *
   * @param index - 0-based transaction index.
   * @param notes - Updated notes string.
   */
  onNotesChange?: (index: number, notes: string) => void;
  /**
   * Optional callback fired when a transaction row is clicked for inspection.
   *
   * @param index - 0-based transaction index.
   */
  onRowSelect?: (index: number) => void;
  /** Index of the currently selected row (for visual highlight). */
  selectedIndex?: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of transaction rows displayed per page. */
export const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Pure helpers — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * Compute summary totals from a list of transactions.
 *
 * @param transactions - Array of RawTransaction objects.
 * @returns Object with totalDebits (≤ 0), totalCredits (≥ 0), and net.
 */
export function computeSummary(transactions: RawTransaction[]): {
  totalDebits: number;
  totalCredits: number;
  net: number;
} {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const tx of transactions) {
    if (tx.amount < 0) {
      totalDebits += tx.amount;
    } else {
      totalCredits += tx.amount;
    }
  }

  return {
    totalDebits,
    totalCredits,
    net: totalCredits + totalDebits,
  };
}

/**
 * Compute the total number of pages for a given item count.
 *
 * @param totalItems - Total number of items to paginate.
 * @param pageSize - Number of items per page.
 * @returns Total number of pages (minimum 1).
 */
export function computeTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

/**
 * Clamp a page number to the valid range [0, totalPages - 1].
 *
 * @param page - Requested 0-indexed page number.
 * @param totalPages - Total number of pages.
 * @returns Clamped page number within [0, totalPages - 1].
 */
export function clampPage(page: number, totalPages: number): number {
  return Math.max(0, Math.min(page, totalPages - 1));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Review table with filter chips, search, sortable dates, per-row category
 * dropdowns, inline editing and pagination.
 *
 * @param props - See TransactionTableProps.
 */
export function TransactionTable({
  transactions,
  categories,
  categoryMap,
  status,
  onCategoryChange,
  onPayeeChange,
  onNotesChange,
  onRowSelect,
  selectedIndex,
}: TransactionTableProps) {
  const [filter, setFilter] = React.useState<ReviewFilter>("all");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = React.useState(0);
  const [checkedRows, setCheckedRows] = React.useState<ReadonlySet<number>>(new Set());
  const [tipDismissed, setTipDismissed] = React.useState(false);

  const searchRef = React.useRef<HTMLInputElement>(null);

  const counts = React.useMemo(
    () => countByStatus(transactions, categoryMap, categories),
    [transactions, categoryMap, categories],
  );

  const visible = React.useMemo(
    () =>
      selectVisibleTransactions(
        transactions,
        categoryMap,
        categories,
        filter,
        query,
        sort,
      ),
    [transactions, categoryMap, categories, filter, query, sort],
  );

  const totalPages = computeTotalPages(visible.length, PAGE_SIZE);
  const safePage = clampPage(currentPage, totalPages);
  if (safePage !== currentPage) setCurrentPage(safePage);

  const pageRows = visible.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Reset paging when the result set changes underneath the user.
  React.useEffect(() => {
    setCurrentPage(0);
  }, [filter, query, transactions.length]);

  /**
   * Focus the search box when the user presses `/` outside a text field.
   */
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const pageIndices = pageRows.map((row) => row.index);
  const checkedOnPage = pageIndices.filter((i) => checkedRows.has(i)).length;
  const allChecked = pageIndices.length > 0 && checkedOnPage === pageIndices.length;
  const headerChecked: boolean | "indeterminate" = allChecked
    ? true
    : checkedOnPage > 0
      ? "indeterminate"
      : false;

  /**
   * Tick or untick a single row.
   *
   * @param index - Absolute transaction index.
   * @param checked - New checkbox state.
   */
  function handleRowChecked(index: number, checked: boolean) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  /**
   * Tick or untick every row on the current page.
   *
   * @param checked - New checkbox state for the page.
   */
  function handleAllChecked(checked: boolean) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      for (const i of pageIndices) {
        if (checked) next.add(i);
        else next.delete(i);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ReviewToolbar
        counts={counts}
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onQueryChange={setQuery}
        searchRef={searchRef}
      />

      <div className="relative overflow-hidden rounded-xl border">
        {/* Loading overlay — shown while AI categorisation is in-flight */}
        {status === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Categorising transactions…</span>
            </div>
          </div>
        )}

        {/* Error banner — manual editing remains possible */}
        {status === "error" && (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            AI categorisation failed. You can assign categories manually using the
            dropdowns below.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                <th className="w-10 px-3 py-2">
                  <Checkbox
                    checked={headerChecked}
                    onCheckedChange={(value) => handleAllChecked(value === true)}
                    aria-label="Select all transactions on this page"
                  />
                </th>
                <th className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    aria-label={`Sort by date, currently ${sort === "asc" ? "ascending" : "descending"}`}
                  >
                    Date
                    {sort === "asc" ? (
                      <ArrowUp className="size-3" aria-hidden />
                    ) : (
                      <ArrowDown className="size-3" aria-hidden />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2">Payee / Description</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">AI</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ index, transaction }) => (
                <TransactionRow
                  key={index}
                  index={index}
                  transaction={transaction}
                  categories={categories}
                  selectedCategory={categoryMap.get(index) ?? ""}
                  reviewStatus={deriveReviewStatus(
                    transaction,
                    categoryMap.get(index),
                    categories,
                  )}
                  checked={checkedRows.has(index)}
                  onCheckedChange={handleRowChecked}
                  onCategoryChange={onCategoryChange}
                  onPayeeChange={onPayeeChange}
                  onNotesChange={onNotesChange}
                  onRowSelect={onRowSelect}
                  isSelected={selectedIndex === index}
                />
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {transactions.length === 0
              ? "No transactions to display."
              : "No transactions match this filter."}
          </div>
        )}

        {/* Selection count + pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {checkedRows.size} selected
          </p>
          <ReviewPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(clampPage(p, totalPages))}
          />
        </div>
      </div>

      {/* Keyboard tip */}
      {!tipDismissed && (
        <div className="flex items-start gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-medium">Tip: Use shortcuts</p>
            <p className="mt-0.5 text-muted-foreground">
              Press <kbd className="rounded border px-1">/</kbd> to search. Click any
              payee, note or category to edit it inline.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss tip"
            onClick={() => setTipDismissed(true)}
            className={cn(
              "rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            )}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
