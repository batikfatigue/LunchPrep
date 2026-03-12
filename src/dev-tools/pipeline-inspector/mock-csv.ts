/**
 * Build a minimal DBS CSV with one data row from the given fields.
 *
 * Used by the pipeline sandbox (browser, dev-only) and by unit tests (Vitest).
 * The Description column is derived by concatenating ref1, ref2, and ref3,
 * matching DBS's actual CSV format.
 *
 * @param fields - Individual DBS CSV field values. All optional with sensible defaults.
 * @returns A complete DBS CSV string (6 metadata rows + header + 1 data row).
 */
export function buildCsv(fields: {
  date?: string;
  code?: string;
  ref1?: string;
  ref2?: string;
  ref3?: string;
  debit?: string;
  credit?: string;
}): string {
  const meta = "row1\nrow2\nrow3\nrow4\nrow5\nrow6\n";
  const header =
    "Transaction Date,Transaction Code,Description,Transaction Ref1,Transaction Ref2,Transaction Ref3,Status,Debit Amount,Credit Amount\n";

  const ref1 = fields.ref1 ?? "";
  const ref2 = fields.ref2 ?? "";
  const ref3 = fields.ref3 ?? "";

  // Reason: DBS's Description column is always Ref1 + ' ' + Ref2 + ' ' + Ref3 concatenated.
  const description = [ref1, ref2, ref3].filter(Boolean).join(" ");

  const row = [
    fields.date ?? "23 Feb 2026",
    fields.code ?? "POS",
    description,
    ref1,
    ref2,
    ref3,
    "",
    fields.debit ?? "10.00",
    fields.credit ?? "",
  ].join(",");
  return meta + header + row + "\n";
}
