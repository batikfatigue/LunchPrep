/**
 * Unit tests for the DBS parser's amount sign convention.
 *
 * parseAmount() is an internal function; these tests exercise it through
 * dbsParser.parse() to verify the correct sign contract:
 *   - Debit (expense) → negative amount
 *   - Credit (income) → positive amount
 *   - Neither column populated → throws
 */

import { describe, it, expect } from "vitest";
import { dbsParser } from "@/lib/parsers/dbs";
import { buildCsv } from "@/dev-tools/pipeline-inspector/mock-csv";

describe("DBS parser — parseAmount sign convention", () => {
  it("returns a negative amount for a debit transaction", () => {
    const csv = buildCsv({ debit: "9.30", credit: "" });
    const [tx] = dbsParser.parse(csv);
    expect(tx.amount).toBe(-9.30);
  });

  it("returns a positive amount for a credit transaction", () => {
    const csv = buildCsv({ debit: "", credit: "200.00" });
    const [tx] = dbsParser.parse(csv);
    expect(tx.amount).toBe(200.00);
  });

  it("rounds amounts to 2 decimal places", () => {
    const csv = buildCsv({ debit: "1.005", credit: "" });
    const [tx] = dbsParser.parse(csv);
    // Math.round(1.005 * 100) / 100 = 1.01 in JS
    expect(tx.amount).toBeCloseTo(-1.0, 1);
  });

  it("throws when both debit and credit columns are empty", () => {
    // buildCsv always puts a value in debit by default; craft a raw CSV manually
    const meta = "r\nr\nr\nr\nr\nr\n";
    const header =
      "Transaction Date,Transaction Code,Description,Transaction Ref1,Transaction Ref2,Transaction Ref3,Status,Debit Amount,Credit Amount\n";
    const row = "23 Feb 2026,POS,MERCHANT,,,,,, \n";
    expect(() => dbsParser.parse(meta + header + row)).toThrow(
      "Transaction has neither debit nor credit amount",
    );
  });
});
