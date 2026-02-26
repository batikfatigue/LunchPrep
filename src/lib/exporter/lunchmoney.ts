/**
 * Lunch Money CSV exporter.
 *
 * Generates CSV strings in Lunch Money import format and triggers
 * browser file downloads.
 *
 * @see specs/output.md for format specification
 */

import type { RawTransaction } from "@/lib/parsers/types";

/** Lunch Money CSV column headers. */
const CSV_HEADERS = "date,payee,amount,category,notes";

/**
 * Format a Date object as an ISO 8601 date string (YYYY-MM-DD).
 *
 * @param date - Date object to format.
 * @returns Date string in YYYY-MM-DD format.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Escape a CSV field value.
 * Wraps in double quotes if the value contains commas, double quotes, or newlines.
 * Existing double quotes are doubled per RFC 4180.
 *
 * @param value - Raw field value.
 * @returns Escaped CSV field value.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate a Lunch Money-compatible CSV string from parsed transactions.
 *
 * @param transactions - Array of RawTransaction objects to export.
 * @param categoriesMap - Optional map from transaction index (0-based) to
 *   category string. If omitted, or if an index has no entry, the category
 *   column is left blank (compatible with Phase 1 behaviour).
 * @returns CSV string with headers and one row per transaction.
 */
export function generateLunchMoneyCsv(
  transactions: RawTransaction[],
  categoriesMap?: ReadonlyMap<number, string>,
): string {
  const rows = transactions.map((tx, i) => {
    const date = formatDate(tx.date);
    const payee = escapeCsvField(tx.description);
    const amount = tx.amount.toFixed(2);
    // Reason: Use provided category if available; fall back to empty string
    // for backward compatibility with Phase 1 and manually-uncategorised rows.
    const category = escapeCsvField(categoriesMap?.get(i) ?? "");
    const notes = escapeCsvField(tx.notes);
    return `${date},${payee},${amount},${category},${notes}`;
  });

  return [CSV_HEADERS, ...rows].join("\n") + "\n";
}

/**
 * Trigger a browser download of a CSV file.
 *
 * @param csvContent - CSV string content to download.
 * @param filename - Optional filename. Defaults to "lunchprep-export-YYYY-MM-DD.csv".
 */
export function downloadCsv(csvContent: string, filename?: string): void {
  const today = formatDate(new Date());
  const name = filename ?? `lunchprep-export-${today}.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  // Reason: Clean up DOM and object URL to prevent memory leaks.
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
