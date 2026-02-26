"use client";

/**
 * Transaction review table with AI category assignment.
 *
 * Renders all parsed transactions in a table with per-row category dropdowns.
 * Supports three overlay states driven by the parent:
 * - "loading"  — semi-transparent overlay with spinner while AI call is in-flight
 * - "error"    — dismissible error banner; all dropdowns remain editable for manual entry
 * - "idle"/"done" — normal interactive table
 *
 * This component is display-only; category state is managed by the parent
 * via `categoryMap` + `onCategoryChange`.
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
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

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
// Component
// ---------------------------------------------------------------------------

/**
 * Transaction review table with per-row category dropdowns.
 *
 * @param props - See TransactionTableProps.
 */
export function TransactionTable({
  transactions,
  categories,
  categoryMap,
  status,
  onCategoryChange,
}: TransactionTableProps) {
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
            />
          ))}
        </tbody>
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
}

/**
 * A single transaction row with an inline category Select dropdown.
 */
function TransactionRow({
  index,
  transaction,
  categories,
  selectedCategory,
  onCategoryChange,
}: TransactionRowProps) {
  const isDebit = transaction.amount < 0;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      {/* Date */}
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
        {formatDate(transaction.date)}
      </td>

      {/* Payee */}
      <td className="px-3 py-2 font-medium">{transaction.description}</td>

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

      {/* Notes */}
      <td className="px-3 py-2 text-muted-foreground">
        {transaction.notes || "—"}
      </td>
    </tr>
  );
}
