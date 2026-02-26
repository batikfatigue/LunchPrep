import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateLunchMoneyCsv, downloadCsv } from "@/lib/exporter/lunchmoney";
import type { RawTransaction } from "@/lib/parsers/types";

/** Helper to create a test transaction with sensible defaults. */
function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date(2026, 1, 23), // 23 Feb 2026
    description: "Test Merchant",
    originalDescription: "TEST MERCHANT RAW",
    amount: -10.5,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateLunchMoneyCsv
// ---------------------------------------------------------------------------

describe("generateLunchMoneyCsv", () => {
  it("generates correct CSV with headers and data rows", () => {
    const txs = [
      makeTx({ description: "Noodle House", amount: -9.3, notes: "" }),
      makeTx({ description: "Alice Wong", amount: 200, notes: "" }),
    ];
    const csv = generateLunchMoneyCsv(txs);
    const lines = csv.trim().split("\n");

    expect(lines[0]).toBe("date,payee,amount,category,notes");
    expect(lines[1]).toBe("2026-02-23,Noodle House,-9.30,,");
    expect(lines[2]).toBe("2026-02-23,Alice Wong,200.00,,");
  });

  it("formats dates as YYYY-MM-DD", () => {
    const tx = makeTx({ date: new Date(2026, 0, 5) }); // 5 Jan 2026
    const csv = generateLunchMoneyCsv([tx]);
    expect(csv).toContain("2026-01-05");
  });

  it("formats amounts to 2 decimal places", () => {
    const txs = [
      makeTx({ amount: -9.3 }),
      makeTx({ amount: 200 }),
      makeTx({ amount: -28.45 }),
      makeTx({ amount: 0 }),
    ];
    const csv = generateLunchMoneyCsv(txs);
    expect(csv).toContain("-9.30");
    expect(csv).toContain("200.00");
    expect(csv).toContain("-28.45");
    expect(csv).toContain("0.00");
  });

  it("leaves category column empty in Phase 1", () => {
    const csv = generateLunchMoneyCsv([makeTx()]);
    const dataLine = csv.trim().split("\n")[1];
    // Format: date,payee,amount,category,notes — category is between 3rd and 5th comma
    const fields = dataLine.split(",");
    expect(fields[3]).toBe(""); // category
  });

  it("escapes payee containing commas", () => {
    const tx = makeTx({ description: "Store, Inc." });
    const csv = generateLunchMoneyCsv([tx]);
    expect(csv).toContain('"Store, Inc."');
  });

  it("escapes notes containing commas", () => {
    const tx = makeTx({ notes: "lunch, dinner" });
    const csv = generateLunchMoneyCsv([tx]);
    expect(csv).toContain('"lunch, dinner"');
  });

  it("escapes double quotes in values", () => {
    const tx = makeTx({ description: 'He said "hello"' });
    const csv = generateLunchMoneyCsv([tx]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("returns only headers for empty transaction list", () => {
    const csv = generateLunchMoneyCsv([]);
    expect(csv.trim()).toBe("date,payee,amount,category,notes");
  });

  it("ends with a trailing newline", () => {
    const csv = generateLunchMoneyCsv([makeTx()]);
    expect(csv.endsWith("\n")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// downloadCsv
// ---------------------------------------------------------------------------

describe("downloadCsv", () => {
  let mockLink: { href: string; download: string; style: { display: string }; click: ReturnType<typeof vi.fn> };
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLink = {
      href: "",
      download: "",
      style: { display: "" },
      click: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(null as unknown as HTMLElement);
    vi.spyOn(document.body, "removeChild").mockReturnValue(null as unknown as HTMLElement);

    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a Blob and triggers download", () => {
    downloadCsv("test,csv,content");

    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    expect(mockLink.click).toHaveBeenCalledOnce();
    expect(mockLink.href).toBe("blob:mock-url");
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("uses default filename with today's date", () => {
    downloadCsv("test");
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    expect(mockLink.download).toBe(`lunchprep-export-${year}-${month}-${day}.csv`);
  });

  it("uses custom filename when provided", () => {
    downloadCsv("test", "custom-file.csv");
    expect(mockLink.download).toBe("custom-file.csv");
  });
});
