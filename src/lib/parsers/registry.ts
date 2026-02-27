/**
 * Bank parser registry.
 *
 * Auto-detects the bank from CSV headers and dispatches to the correct parser.
 * Adding a new bank = adding one file implementing BankParser and registering it here.
 */

import type { BankParser, RawTransaction } from "@/lib/parsers/types";
import { dbsParser } from "@/lib/parsers/dbs";

/** All registered bank parsers, checked in order. */
const parsers: BankParser[] = [dbsParser];

/**
 * Detect the bank from CSV content and parse transactions.
 *
 * Iterates through registered parsers, calling detect() on each.
 * Returns the first matching parser's parse() result.
 *
 * @param csvContent - Raw CSV file content as a string.
 * @returns Array of cleaned RawTransaction objects.
 * @throws Error if no registered parser matches the CSV format.
 */
export function detectAndParse(csvContent: string): RawTransaction[] {
  for (const parser of parsers) {
    if (parser.detect(csvContent)) {
      return parser.parse(csvContent);
    }
  }

  throw new Error(
    "Unsupported bank CSV format. No registered parser could detect the file format. " +
    "Currently supported banks: " +
    parsers.map((p) => p.bankName).join(", "),
  );
}
