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
import { Loader2 } from "lucide-react";
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
}

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
  className?: string;
}

/**
 * A table cell that switches to an input on click.
 * Commits on blur or Enter; cancels on Escape.
 */
function EditableCell({ value, placeholder = "—", onCommit, className }: EditableCellProps) {
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
        onBlur={commit}
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
      onClick={startEdit}
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
}: TransactionTableProps) {
  const summary = computeSummary(transactions);

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
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Payee</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <TransactionRow
              key={i}
              index={i}
              transaction={tx}
              categories={categories}
              selectedCategory={categoryMap.get(i) ?? ""}
              onCategoryChange={onCategoryChange}
              onPayeeChange={onPayeeChange}
              onNotesChange={onNotesChange}
            />
          ))}
        </tbody>

        {/* Summary footer — only shown when there are transactions */}
        {transactions.length > 0 && (
          <tfoot>
            <tr className="border-t-2 bg-muted/30 font-medium">
              <td className="px-3 py-2 text-xs text-muted-foreground" colSpan={2}>
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
}: TransactionRowProps) {
  const isDebit = transaction.amount < 0;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
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
            className="text-muted-foreground"
          />
        ) : (
          transaction.notes || "—"
        )}
      </td>
    </tr>
  );
}
