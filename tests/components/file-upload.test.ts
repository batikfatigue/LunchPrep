import { describe, it, expect } from "vitest";
import { isCsvFile } from "@/components/file-upload";

/**
 * Tests for the file-upload component's helper logic.
 *
 * NOTE: isCsvFile is exported as a pure function for direct unit testing,
 * avoiding a dependency on @testing-library/react for this validation logic.
 */
describe("isCsvFile", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("accepts a file with .csv extension", () => {
    const file = new File(["content"], "transactions.csv", { type: "text/csv" });
    expect(isCsvFile(file)).toBe(true);
  });

  it("accepts a file with uppercase .CSV extension", () => {
    const file = new File(["content"], "EXPORT.CSV", { type: "text/csv" });
    expect(isCsvFile(file)).toBe(true);
  });

  it("accepts a file with mixed-case .Csv extension", () => {
    const file = new File(["content"], "DBS_Jan2026.Csv", { type: "text/csv" });
    expect(isCsvFile(file)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Failure cases
  // ---------------------------------------------------------------------------

  it("rejects a .txt file", () => {
    const file = new File(["content"], "transactions.txt", { type: "text/plain" });
    expect(isCsvFile(file)).toBe(false);
  });

  it("rejects an .xlsx file", () => {
    const file = new File(["content"], "statement.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(isCsvFile(file)).toBe(false);
  });

  it("rejects a .pdf file", () => {
    const file = new File(["content"], "statement.pdf", { type: "application/pdf" });
    expect(isCsvFile(file)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("rejects a file with no extension", () => {
    const file = new File(["content"], "transactions", { type: "text/csv" });
    expect(isCsvFile(file)).toBe(false);
  });

  it("rejects a file whose name only contains '.csv' in the middle", () => {
    // e.g. "mycsv.backup" — .csv is not at the end
    const file = new File(["content"], "mycsv.backup", { type: "text/plain" });
    expect(isCsvFile(file)).toBe(false);
  });

  it("accepts a file whose name has extra dots before .csv", () => {
    const file = new File(["content"], "export.2026.01.csv", { type: "text/csv" });
    expect(isCsvFile(file)).toBe(true);
  });

  it("rejects an empty filename (edge case: empty string name)", () => {
    const file = new File(["content"], "", { type: "text/plain" });
    // An empty filename cannot end with .csv
    expect(isCsvFile(file)).toBe(false);
  });
});
