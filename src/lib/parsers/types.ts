/**
 * Core type definitions for bank CSV parsers.
 *
 * These interfaces define the contract for all bank parsers and the
 * standardised transaction format used throughout the pipeline.
 */

/**
 * A single cleaned bank transaction ready for categorisation and export.
 *
 * @property date - Transaction date as a Date object (no time component).
 * @property description - Cleaned payee/merchant name (title-cased, PII stripped).
 * @property originalDescription - Raw Description column value from the bank CSV (untouched).
 * @property amount - Signed amount: negative = debit/expense, positive = credit/income. Rounded to 2 d.p.
 * @property transactionCode - Bank transaction code (e.g. "POS", "MST", "ICT", "ITR").
 * @property notes - Contextual info like PayNow OTHR field (stripped of refs and default placeholders).
 * @property originalPII - Map of mock placeholder values back to original PII for later restoration. Empty {} in Phase 1.
 */
export interface RawTransaction {
  date: Date;
  description: string;
  originalDescription: string;
  amount: number;
  transactionCode: string;
  notes: string;
  originalPII: Record<string, string>;
}

/**
 * Interface that all bank-specific CSV parsers must implement.
 *
 * Each parser is responsible for detecting its bank's CSV format and
 * parsing the raw CSV string into standardised RawTransaction objects.
 */
export interface BankParser {
  /** Human-readable bank name (e.g. "DBS"). */
  bankName: string;

  /**
   * Detect whether the given CSV content matches this bank's format.
   *
   * @param csvContent - Raw CSV file content as a string.
   * @returns True if this parser can handle the CSV.
   */
  detect(csvContent: string): boolean;

  /**
   * Parse the raw CSV content into an array of cleaned transactions.
   *
   * @param csvContent - Raw CSV file content as a string.
   * @returns Array of cleaned RawTransaction objects.
   * @throws Error if the CSV is malformed or cannot be parsed.
   */
  parse(csvContent: string): RawTransaction[];
}
