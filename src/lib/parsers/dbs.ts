/**
 * DBS bank CSV parser.
 *
 * Parses raw DBS bank statement CSV files into cleaned RawTransaction objects.
 * Handles all DBS transaction codes: POS, MST, ICT, ITR with their sub-types.
 *
 * @see specs/bank-parsing.md for cleaning rules
 * @see docs/dbs_formats.md for raw CSV field layouts
 */

import Papa from "papaparse";
import type { BankParser, RawTransaction } from "@/lib/parsers/types";
import dbsCodes from "@/lib/parsers/data/dbs_codes.json";

/** Number of metadata rows to skip before the header row in DBS CSVs. */
const DBS_METADATA_ROWS = 6;

/** Month abbreviation to 0-indexed month number lookup. */
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** PapaParse row shape after parsing with header: true. */
interface DBSRow {
  "Transaction Date": string;
  "Transaction Code": string;
  "Description": string;
  "Transaction Ref1": string;
  "Transaction Ref2": string;
  "Transaction Ref3": string;
  "Status": string;
  "Debit Amount": string;
  "Credit Amount": string;
}

/** Cleaned payee and notes extracted by a per-code cleaner. */
interface CleanedFields {
  payee: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip the first 6 metadata rows from a DBS CSV, returning content
 * starting from the header row (row 7).
 *
 * @param csvContent - Raw CSV file content.
 * @returns CSV content starting from the column header row.
 */
function skipMetadataRows(csvContent: string): string {
  // Reason: DBS CSVs have account/balance info in rows 1-6; actual column
  // headers start on row 7. PapaParse cannot skip arbitrary leading rows.
  const lines = csvContent.split(/\r?\n/);
  return lines.slice(DBS_METADATA_ROWS).join("\n");
}

/**
 * Parse a DBS date string into a Date object.
 *
 * @param dateStr - Date in "DD Mon YYYY" format (e.g. "23 Feb 2026").
 * @returns Date object set to the parsed date at midnight local time.
 * @throws Error if the date string is malformed.
 */
function parseDate(dateStr: string): Date {
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) {
    throw new Error(`Invalid DBS date format: "${dateStr}"`);
  }
  const [dayStr, monthStr, yearStr] = parts;
  const month = MONTHS[monthStr];
  if (month === undefined) {
    throw new Error(`Unknown month abbreviation: "${monthStr}"`);
  }
  // Reason: Using Date constructor with explicit parts avoids timezone
  // issues that occur with new Date("23 Feb 2026") string parsing.
  return new Date(parseInt(yearStr, 10), month, parseInt(dayStr, 10));
}

/**
 * Parse DBS debit/credit amount columns into a signed number.
 *
 * @param debitStr - Debit Amount column value (empty if credit).
 * @param creditStr - Credit Amount column value (empty if debit).
 * @returns Negative number for debits, positive for credits, rounded to 2 d.p.
 * @throws Error if neither column has a parseable value.
 */
function parseAmount(debitStr: string, creditStr: string): number {
  const debit = debitStr.trim();
  const credit = creditStr.trim();

  if (debit !== "") {
    return -Math.round(parseFloat(debit) * 100) / 100;
  }
  if (credit !== "") {
    return Math.round(parseFloat(credit) * 100) / 100;
  }
  throw new Error("Transaction has neither debit nor credit amount");
}

/**
 * Smart title-case a string, handling slashes, hyphens, and parentheses.
 * Collapses multiple whitespace characters before casing.
 *
 * @param str - Input string (typically UPPER CASE from DBS).
 * @returns Title-cased string (e.g. "Bus/Mrt", "Burger King (Xyz)").
 */
function titleCase(str: string): string {
  // Reason: DBS merchant names come in ALL CAPS with inconsistent spacing.
  const collapsed = str.replace(/\s+/g, " ").trim();

  return collapsed
    .split(" ")
    .map((word) => titleCaseWord(word))
    .join(" ");
}

/**
 * Title-case a single word, handling / and - as sub-word separators.
 *
 * @param word - A single whitespace-free token.
 * @returns Title-cased word.
 */
function titleCaseWord(word: string): string {
  // Reason: Merchants like "BUS/MRT" and "SG-PAYMENT" need each segment cased.
  return word
    .split("/")
    .map((segment) =>
      segment
        .split("-")
        .map((part) => {
          if (part.length === 0) return part;
          // Reason: Handle parentheses — "(XYZ)" should become "(Xyz)".
          if (part.startsWith("(")) {
            return "(" + part.slice(1, 2).toUpperCase() + part.slice(2).toLowerCase();
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join("-"),
    )
    .join("/");
}

/**
 * Strip PII patterns from a string.
 * Removes card numbers, and optionally strips single-token references
 * that are 15+ characters long.
 *
 * @param value - String to strip PII from.
 * @param stripLongRefs - If true, remove single-token alphanumeric refs >= 15 chars.
 * @returns Cleaned string with PII removed.
 */
function stripPII(value: string, stripLongRefs = false): string {
  // Strip card numbers: XXXX-XXXX-XXXX-XXXX
  let result = value.replace(/\d{4}-\d{4}-\d{4}-\d{4}/g, "").trim();

  if (stripLongRefs) {
    // Reason: Notes fields may contain long alphanumeric reference strings
    // that are not meaningful to the user. Strip continuous alphanum >= 15 chars.
    result = result.replace(/\b[A-Za-z0-9]{15,}\b/g, "").trim();
  }

  // Collapse any resulting double spaces
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

/**
 * Check if a notes string is a single-token reference that should be stripped.
 * A reference is a single token (no spaces) with length >= 15 that is
 * alphanumeric or alphanumeric with hyphens.
 *
 * @param notes - Notes string after OTHR prefix stripping.
 * @returns True if the notes look like a reference to be stripped.
 */
function isReferenceToken(notes: string): boolean {
  const trimmed = notes.trim();
  if (trimmed.includes(" ")) return false;
  // Reason: Single tokens like "M008488410010949564" (19 chars) or
  // "qsb-sqr-sg-38231108740123" (25 chars with hyphens) are reference IDs.
  return trimmed.length >= 15 && /^[A-Za-z0-9-]+$/.test(trimmed);
}

// ---------------------------------------------------------------------------
// Per-code cleaners
// ---------------------------------------------------------------------------

/**
 * Clean a POS (NETS QR) transaction.
 * Extracts payee from Ref2 by stripping the "TO: " prefix.
 *
 * @param _ref1 - Transaction Ref1 (unused for POS).
 * @param ref2 - Transaction Ref2 containing "TO: <MERCHANT>".
 * @returns Cleaned payee and empty notes.
 */
function cleanPOS(_ref1: string, ref2: string): CleanedFields {
  const payee = titleCase(ref2.replace(/^TO:\s*/i, ""));
  return { payee, notes: "" };
}

/**
 * Clean an MST/UPI/UMC card payment transaction.
 * Extracts merchant name from Ref1 by stripping acquirer suffix and
 * trailing numeric merchant reference.
 *
 * @param ref1 - Transaction Ref1 containing merchant + acquirer suffix.
 * @returns Cleaned payee and empty notes.
 */
function cleanMST(ref1: string): CleanedFields {
  // Step 1: Remove acquirer/country/date suffix (e.g. "SI SGP 18FEB")
  // Reason: The suffix format is <2-3 letter code> <2-3 letter country> <2digit><3letter month>
  let merchant = ref1.replace(/\s+[A-Za-z]{2,3}\s+[A-Z]{2,3}\s+\d{2}[A-Z]{3}$/i, "");

  // Step 2: Strip trailing all-numeric merchant reference token
  // Reason: "BUS/MRT 799701767" → "BUS/MRT"; "FastFood 123456" → "FastFood"
  merchant = merchant.replace(/\s+\d+$/, "");

  // Step 3: Trim and title-case
  const payee = titleCase(merchant.trim());
  return { payee, notes: "" };
}

/**
 * Clean an ICT (interbank transfer) transaction.
 * Handles PayNow (in/out), external bank (in/out) sub-types.
 *
 * @param ref1 - Transaction Ref1 identifying the sub-type.
 * @param ref2 - Transaction Ref2 containing payee name or user note.
 * @param ref3 - Transaction Ref3 containing OTHR notes or reference.
 * @returns Cleaned payee and notes.
 */
function cleanICT(ref1: string, ref2: string, ref3: string): CleanedFields {
  // PayNow outgoing: "PayNow Transfer <ref>"
  if (ref1.startsWith("PayNow Transfer")) {
    const rawPayee = ref2.replace(/^To:\s*/i, "");
    const payee = titleCase(rawPayee);
    const rawNotes = ref3.replace(/^OTHR\s*/i, "").trim();
    const notes = cleanICTNotes(rawNotes);
    return { payee, notes };
  }

  // PayNow incoming: "Incoming PayNow Ref <ref>"
  if (ref1.startsWith("Incoming PayNow")) {
    const rawPayee = ref2.replace(/^From:\s*/i, "");
    const payee = titleCase(rawPayee);
    const rawNotes = ref3.replace(/^OTHR\s*/i, "").trim();
    const notes = cleanICTNotes(rawNotes);
    return { payee, notes };
  }

  // External bank outgoing: "<BANK>:<ACCOUNT>:I-BANK"
  if (/^[^:]+:[^:]+:I-BANK$/i.test(ref1)) {
    const bankName = ref1.split(":")[0];
    const payee = titleCase(bankName);
    // Reason: For external bank transfers, user input note is in Ref2 (no OTHR prefix).
    // Ref3 is just "OTHR <reference number>" — discard it.
    const notes = ref2.trim();
    return { payee, notes };
  }

  // External bank incoming: refs are unmeaningful alphanumeric strings
  return { payee: "External Transfer", notes: "" };
}

/**
 * Clean ICT notes by stripping the DBS default placeholder and long references.
 *
 * @param rawNotes - Notes string after OTHR prefix removal.
 * @returns Cleaned notes, or empty string if default/reference.
 */
function cleanICTNotes(rawNotes: string): string {
  // Reason: "PayNow transfer" is a DBS default placeholder — not user-entered.
  if (rawNotes.toLowerCase() === "paynow transfer") {
    return "";
  }
  // Reason: Single-token strings >= 15 chars are reference IDs, not user notes.
  if (isReferenceToken(rawNotes)) {
    return "";
  }
  return rawNotes;
}

/**
 * Clean an ITR (DBS-to-DBS transfer) transaction.
 * Handles PayLah! withdrawal/top-up and standard DBS transfers.
 *
 * @param ref1 - Transaction Ref1 identifying the sub-type.
 * @param ref3 - Transaction Ref3 containing OTHR notes (for outgoing transfers).
 * @returns Cleaned payee and notes.
 */
function cleanITR(ref1: string, ref3: string): CleanedFields {
  // PayLah! withdrawal: "SEND BACK FROM PAYLAH! :"
  if (ref1.startsWith("SEND BACK FROM PAYLAH!")) {
    return { payee: "PayLah!", notes: "Received" };
  }

  // PayLah! top-up: "TOP UP TO PAYLAH! :"
  if (ref1.startsWith("TOP UP TO PAYLAH!")) {
    return { payee: "PayLah!", notes: "Top-Up" };
  }

  // Outgoing DBS transfer: "DBS:I-BANK"
  if (ref1.trim().toUpperCase() === "DBS:I-BANK") {
    // Reason: Ref3 format is "OTHR <user notes> <trailing ref number>".
    // Strip OTHR prefix and trailing numeric reference.
    const rawNotes = ref3.replace(/^OTHR\s*/i, "").replace(/\s+\d+$/, "").trim();
    return { payee: "Dbs", notes: rawNotes };
  }

  // Incoming DBS transfer: Ref1 is a reference string, Ref2 is "<ACCOUNT>:IB"
  return { payee: "Dbs", notes: "" };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Look up a DBS transaction code description from the static codes dictionary.
 *
 * @param code - Transaction code (e.g. "POS", "MST").
 * @returns The code description, or the raw code if not found.
 */
function lookupTransactionCode(code: string): string {
  return (dbsCodes as Record<string, string>)[code] ?? code;
}

/**
 * DBS bank CSV parser implementing the BankParser interface.
 *
 * Detects DBS CSV format from headers and parses all transaction types
 * (POS, MST, ICT, ITR) with per-code cleaning rules.
 */
export const dbsParser: BankParser = {
  bankName: "DBS",

  /**
   * Detect whether the CSV content is from a DBS bank statement.
   * Checks for DBS-specific column headers in the first 10 lines.
   *
   * @param csvContent - Raw CSV file content.
   * @returns True if the CSV matches DBS format.
   */
  detect(csvContent: string): boolean {
    const firstLines = csvContent.split(/\r?\n/).slice(0, 10).join("\n");
    // Reason: "Transaction Ref1" is unique to DBS — other banks don't use this header.
    return (
      firstLines.includes("Transaction Date") &&
      firstLines.includes("Transaction Ref1")
    );
  },

  /**
   * Parse a DBS bank CSV into cleaned RawTransaction objects.
   *
   * @param csvContent - Raw CSV file content.
   * @returns Array of cleaned RawTransaction objects.
   * @throws Error if the CSV is empty or cannot be parsed.
   */
  parse(csvContent: string): RawTransaction[] {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error("CSV content is empty");
    }

    const dataContent = skipMetadataRows(csvContent);
    const parsed = Papa.parse<DBSRow>(dataContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.data.length === 0) {
      throw new Error("No transaction rows found in CSV");
    }

    const transactions: RawTransaction[] = [];

    for (const row of parsed.data) {
      const dateStr = row["Transaction Date"]?.trim();
      const code = row["Transaction Code"]?.trim();
      const description = row["Description"] ?? "";
      const ref1 = row["Transaction Ref1"] ?? "";
      const ref2 = row["Transaction Ref2"] ?? "";
      const ref3 = row["Transaction Ref3"] ?? "";
      const debitStr = row["Debit Amount"] ?? "";
      const creditStr = row["Credit Amount"] ?? "";

      // Skip rows without a date (possible trailing empty rows)
      if (!dateStr) continue;

      const date = parseDate(dateStr);
      const amount = parseAmount(debitStr, creditStr);

      let cleaned: CleanedFields;
      const codeUpper = code.toUpperCase();

      switch (codeUpper) {
        case "POS":
          cleaned = cleanPOS(ref1, ref2);
          break;
        case "MST":
        case "UPI":
        case "UMC":
        case "UMC-S":
          cleaned = cleanMST(ref1);
          break;
        case "ICT":
          cleaned = cleanICT(ref1, ref2, ref3);
          break;
        case "ITR":
          cleaned = cleanITR(ref1, ref3);
          break;
        default:
          // Reason: Unknown transaction codes get a basic clean — title-case
          // the description and leave notes empty.
          cleaned = { payee: titleCase(description), notes: "" };
          break;
      }

      // Apply general PII stripping to the payee
      const payee = stripPII(cleaned.payee);

      transactions.push({
        date,
        description: payee,
        originalDescription: description,
        amount,
        transactionCode: lookupTransactionCode(code),
        notes: cleaned.notes,
        originalPII: {},
      });
    }

    return transactions;
  },
};
