"use client";

/**
 * Transaction review table with AI category assignment and inline editing.
 *
 * Renders all parsed transactions in a table with per-row category dropdowns
 * and inline editing for payee and notes. A summary footer row shows total
 * debits, credits, and net amount.
 *
 * Overlay states driven by the parent:
 * - "loading"  — semi-transparent overlay with spinner while AI call is in-flight
 * - "error"    — dismissible error banner; all dropdowns remain editable for manual entry
 * - "idle"/"done" — normal interactive table
 *
 * This component is display-only; all state is managed by the parent.
 */

import * as React from "react";
import { Select } from "radix-ui";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

/**
 * Format a transaction amount for display with sign prefix and two decimal places.
 *
 * @param amount - Signed amount (negative = debit, positive = credit).
 * @returns Formatted string e.g. "-$9.30" or "+$200.00".
 */
function formatAmount(amount: number): string {
  const sign = amount < 0 ? "-" : "+";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

/**
 * Format a Date object using Singapore locale short date (DD/MM/YYYY).
 *
 * @param date - Transaction date.
 * @returns Formatted date string.
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// EditableCell sub-component
// ---------------------------------------------------------------------------

interface EditableCellProps {
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
  /** Called when the input blurs (edit ends), before any follow-up row click fires. */
  onEditEnd?: () => void;
  className?: string;
}

/**
 * A table cell that switches to an input on click.
 * Commits on blur or Enter; cancels on Escape.
 */
function EditableCell({ value, placeholder = "—", onCommit, onEditEnd, className }: EditableCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync draft when the upstream value changes (e.g. after restore()).
  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    onCommit(draft);
  }

  function cancel() {
    setEditing(false);
    setDraft(value);
  }

  // Auto-focus the input when editing starts.
  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        // Reason: stop propagation so clicks inside the active input do not bubble to <tr onClick>.
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          commit();
          // Reason: notify the row that an edit just ended so it can suppress the
          // follow-up click that caused this blur (blur fires before click).
          onEditEnd?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn(
          "w-full rounded border bg-background px-1.5 py-0.5 text-sm outline-none",
          "focus:ring-2 focus:ring-ring focus:ring-offset-0",
          className,
        )}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // Reason: stop propagation so clicking to enter edit mode does not bubble to <tr onClick>.
        e.stopPropagation();
        startEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") startEdit();
      }}
      title="Click to edit"
      className={cn(
        "block cursor-text rounded px-1.5 py-0.5 hover:bg-accent/50",
        !value && "text-muted-foreground/50",
        className,
      )}
    >
      {value || placeholder}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Transaction review table with per-row category dropdowns, inline editing,
 * and a summary footer row.
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
  const summary = computeSummary(transactions);

  // ---- Pagination state ----
  const [currentPage, setCurrentPage] = React.useState(0);
  const totalPages = computeTotalPages(transactions.length, PAGE_SIZE);

  // Reset to page 0 when the transaction data changes (e.g. new file upload).
  const prevLengthRef = React.useRef(transactions.length);
  React.useEffect(() => {
    if (transactions.length !== prevLengthRef.current) {
      setCurrentPage(0);
      prevLengthRef.current = transactions.length;
    }
  }, [transactions.length]);

  // Clamp current page if it exceeds the new total (e.g. after data shrinks).
  const safePage = clampPage(currentPage, totalPages);
  if (safePage !== currentPage) setCurrentPage(safePage);

  // Slice transactions for the current page.
  const startIndex = safePage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, transactions.length);
  const pageTransactions = transactions.slice(startIndex, endIndex);

  // ---- Page jump input state ----
  const [pageInput, setPageInput] = React.useState(String(safePage + 1));

  // Keep input in sync when navigating via arrows.
  React.useEffect(() => {
    setPageInput(String(safePage + 1));
  }, [safePage]);

  /** Commit the page input value, clamping to valid range. */
  function commitPageInput() {
    const parsed = parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(safePage + 1));
      return;
    }
    const clamped = clampPage(parsed - 1, totalPages);
    setCurrentPage(clamped);
    setPageInput(String(clamped + 1));
  }

  const showPagination = transactions.length > 0 && totalPages > 1;

  return (
    <div className="relative overflow-auto rounded-md border">
      {/* Loading overlay — shown while AI categorisation is in-flight */}
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Categorising transactions…</span>
          </div>
        </div>
      )}

      {/* Error banner — shown when AI call fails; manual editing remains possible */}
      {status === "error" && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          AI categorisation failed. You can assign categories manually using the
          dropdowns below.
        </div>
      )}

      {/* Transaction table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 w-12 text-center">No.</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Payee</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {pageTransactions.map((tx, localIdx) => {
            // Reason: absolute index ensures categoryMap lookups and callbacks
            // reference the correct transaction regardless of current page.
            const absoluteIdx = startIndex + localIdx;
            return (
              <TransactionRow
                key={absoluteIdx}
                index={absoluteIdx}
                transaction={tx}
                categories={categories}
                selectedCategory={categoryMap.get(absoluteIdx) ?? ""}
                onCategoryChange={onCategoryChange}
                onPayeeChange={onPayeeChange}
                onNotesChange={onNotesChange}
                onRowSelect={onRowSelect}
                isSelected={selectedIndex === absoluteIdx}
              />
            );
          })}
        </tbody>

        {/* Summary footer — reflects ALL transactions, not just current page */}
        {transactions.length > 0 && (
          <tfoot>
            <tr className="border-t-2 bg-muted/30 font-medium">
              <td className="px-3 py-2 text-xs text-muted-foreground" colSpan={3}>
                Summary ({transactions.length} transactions)
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {formatAmount(summary.totalDebits)}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {formatAmount(summary.totalCredits)}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      summary.net < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400",
                    )}
                  >
                    Net: {formatAmount(summary.net)}
                  </span>
                </div>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>

      {/* Pagination controls */}
      {showPagination && (
        <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
          <button
            id="pagination-prev"
            type="button"
            disabled={safePage === 0}
            onClick={() => setCurrentPage((p) => clampPage(p - 1, totalPages))}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors",
              safePage === 0
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-accent hover:text-foreground",
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              id="pagination-page-input"
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPageInput();
              }}
              className={cn(
                "w-8 rounded-md border-2 border-border bg-background px-1 py-0.5 text-center text-sm tabular-nums text-foreground",
                "outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring",
              )}
              aria-label="Page number"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            id="pagination-next"
            type="button"
            disabled={safePage === totalPages - 1}
            onClick={() => setCurrentPage((p) => clampPage(p + 1, totalPages))}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors",
              safePage === totalPages - 1
                ? "cursor-not-allowed opacity-30"
                : "hover:bg-accent hover:text-foreground",
            )}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No transactions to display.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

interface TransactionRowProps {
  index: number;
  transaction: RawTransaction;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (index: number, category: string) => void;
  onPayeeChange?: (index: number, payee: string) => void;
  onNotesChange?: (index: number, notes: string) => void;
  onRowSelect?: (index: number) => void;
  isSelected?: boolean;
}

/**
 * A single transaction row with inline-editable payee/notes and a category dropdown.
 */
function TransactionRow({
  index,
  transaction,
  categories,
  selectedCategory,
  onCategoryChange,
  onPayeeChange,
  onNotesChange,
  onRowSelect,
  isSelected,
}: TransactionRowProps) {
  const isDebit = transaction.amount < 0;

  // Reason: When the user clicks elsewhere on the row to blur an active EditableCell,
  // the browser fires blur before click. This one-frame refractory flag lets us detect
  // that "blur-caused click" and skip onRowSelect, preventing an unwanted inspector scroll.
  const editJustEndedRef = React.useRef(false);

  function handleEditEnd() {
    editJustEndedRef.current = true;
    setTimeout(() => {
      editJustEndedRef.current = false;
    }, 0);
  }

  return (
    <tr
      className={cn(
        "border-b last:border-0 hover:bg-muted/30",
        isSelected && "bg-accent/40 ring-1 ring-inset ring-ring/20",
        onRowSelect && "cursor-pointer",
      )}
      onClick={() => {
        if (editJustEndedRef.current) return;
        onRowSelect?.(index);
      }}
    >
      {/* Number */}
      <td className="px-3 py-2 text-center text-xs text-muted-foreground/70 tabular-nums">
        {index + 1}
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
        {formatDate(transaction.date)}
      </td>

      {/* Payee — inline editable when onPayeeChange is provided */}
      <td className="px-3 py-2 font-medium">
        {onPayeeChange ? (
          <EditableCell
            value={transaction.description}
            onCommit={(val) => onPayeeChange(index, val)}
            onEditEnd={handleEditEnd}
          />
        ) : (
          transaction.description
        )}
      </td>

      {/* Amount — red for debits, green for credits */}
      <td
        className={cn(
          "px-3 py-2 text-right tabular-nums",
          isDebit ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
        )}
      >
        {formatAmount(transaction.amount)}
      </td>

      {/* Category dropdown */}
      <td className="px-3 py-2">
        <Select.Root
          value={selectedCategory}
          onValueChange={(value) => onCategoryChange(index, value)}
        >
          <Select.Trigger
            className={cn(
              "flex h-7 w-36 items-center justify-between gap-1 rounded border",
              "bg-background px-2 text-xs transition-colors",
              "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              !selectedCategory && "text-muted-foreground",
            )}
            aria-label="Select category"
          >
            <Select.Value placeholder="Select…" />
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 max-h-60 min-w-[9rem] overflow-auto rounded-md border bg-popover shadow-md"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport>
                {categories.map((cat) => (
                  <Select.Item
                    key={cat}
                    value={cat}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-xs outline-none",
                      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    )}
                  >
                    <Select.ItemText>{cat}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </td>

      {/* Notes — inline editable when onNotesChange is provided */}
      <td className="px-3 py-2 text-muted-foreground">
        {onNotesChange ? (
          <EditableCell
            value={transaction.notes}
            placeholder="—"
            onCommit={(val) => onNotesChange(index, val)}
            onEditEnd={handleEditEnd}
            className="text-muted-foreground"
          />
        ) : (
          transaction.notes || "—"
        )}
      </td>
    </tr>
  );
}
