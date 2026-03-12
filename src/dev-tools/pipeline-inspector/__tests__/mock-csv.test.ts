import { describe, it, expect } from "vitest";
import { buildCsv } from "@/dev-tools/pipeline-inspector/mock-csv";

describe("buildCsv", () => {
  it("produces a valid DBS CSV with 6 metadata rows + header + 1 data row", () => {
    const csv = buildCsv({ code: "POS", ref1: "NETS QR PAYMENT ABC123", ref2: "TO: MERCHANT" });
    const lines = csv.trim().split("\n");

    // 6 metadata + 1 header + 1 data = 8 lines
    expect(lines).toHaveLength(8);

    // Header is on line 7 (index 6)
    expect(lines[6]).toBe(
      "Transaction Date,Transaction Code,Description,Transaction Ref1,Transaction Ref2,Transaction Ref3,Status,Debit Amount,Credit Amount",
    );
  });

  it("derives Description by concatenating ref1, ref2, and ref3", () => {
    const csv = buildCsv({ ref1: "AAA", ref2: "BBB", ref3: "CCC" });
    const dataRow = csv.trim().split("\n").pop()!;
    const cols = dataRow.split(",");

    // Column index 2 is Description
    expect(cols[2]).toBe("AAA BBB CCC");
    // Ref columns match individually
    expect(cols[3]).toBe("AAA");
    expect(cols[4]).toBe("BBB");
    expect(cols[5]).toBe("CCC");
  });

  it("omits empty refs from derived Description", () => {
    const csv = buildCsv({ ref1: "ONLY REF1" });
    const dataRow = csv.trim().split("\n").pop()!;
    const cols = dataRow.split(",");

    expect(cols[2]).toBe("ONLY REF1");
  });

  it("uses default values when no fields provided", () => {
    const csv = buildCsv({});
    const dataRow = csv.trim().split("\n").pop()!;
    const cols = dataRow.split(",");

    // Default date
    expect(cols[0]).toBe("23 Feb 2026");
    // Default code
    expect(cols[1]).toBe("POS");
    // Default debit
    expect(cols[7]).toBe("10.00");
  });

  it("sets credit and clears debit when credit is provided", () => {
    const csv = buildCsv({ debit: "", credit: "50.00" });
    const dataRow = csv.trim().split("\n").pop()!;
    const cols = dataRow.split(",");

    expect(cols[7]).toBe("");
    expect(cols[8]).toBe("50.00");
  });
});
