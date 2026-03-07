import { describe, it, expect } from "vitest";
import { computeSummary } from "@/components/transaction-table";
import type { RawTransaction } from "@/lib/parsers/types";

/** Helper to build a minimal RawTransaction with sensible defaults. */
function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date(2026, 1, 1),
    description: "Test Merchant",
    originalDescription: "TEST MERCHANT RAW",
    amount: -10.0,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

describe("computeSummary", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("correctly separates debits and credits", () => {
    const txs = [
      makeTx({ amount: -9.30 }),  // debit
      makeTx({ amount: -1.70 }),  // debit
      makeTx({ amount: 200.00 }), // credit
    ];
    const { totalDebits, totalCredits, net } = computeSummary(txs);

    // Reason: Use toBeCloseTo for floating-point arithmetic to avoid rounding errors.
    expect(totalDebits).toBeCloseTo(-11.0, 5);
    expect(totalCredits).toBeCloseTo(200.0, 5);
    expect(net).toBeCloseTo(189.0, 5);
  });

  it("computes a negative net when debits exceed credits", () => {
    const txs = [
      makeTx({ amount: -100.0 }),
      makeTx({ amount: 50.0 }),
    ];
    const { net } = computeSummary(txs);
    expect(net).toBeCloseTo(-50.0, 5);
  });

  it("computes a positive net when credits exceed debits", () => {
    const txs = [
      makeTx({ amount: -30.0 }),
      makeTx({ amount: 500.0 }),
    ];
    const { net } = computeSummary(txs);
    expect(net).toBeCloseTo(470.0, 5);
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("returns zero totals for an empty transaction list", () => {
    const { totalDebits, totalCredits, net } = computeSummary([]);
    expect(totalDebits).toBe(0);
    expect(totalCredits).toBe(0);
    expect(net).toBe(0);
  });

  it("handles all-debit list correctly", () => {
    const txs = [
      makeTx({ amount: -20.0 }),
      makeTx({ amount: -5.50 }),
    ];
    const { totalDebits, totalCredits, net } = computeSummary(txs);
    expect(totalDebits).toBeCloseTo(-25.5, 5);
    expect(totalCredits).toBe(0);
    expect(net).toBeCloseTo(-25.5, 5);
  });

  it("handles all-credit list correctly", () => {
    const txs = [
      makeTx({ amount: 100.0 }),
      makeTx({ amount: 250.0 }),
    ];
    const { totalDebits, totalCredits, net } = computeSummary(txs);
    expect(totalDebits).toBe(0);
    expect(totalCredits).toBeCloseTo(350.0, 5);
    expect(net).toBeCloseTo(350.0, 5);
  });

  it("treats a zero-amount transaction as neither debit nor credit", () => {
    const txs = [
      makeTx({ amount: 0 }),
      makeTx({ amount: -10.0 }),
    ];
    const { totalDebits, totalCredits } = computeSummary(txs);
    // Reason: amount === 0 is classified as credit (>= 0 branch).
    expect(totalCredits).toBe(0);
    expect(totalDebits).toBeCloseTo(-10.0, 5);
  });

  it("handles a single transaction", () => {
    const { totalDebits, totalCredits, net } = computeSummary([
      makeTx({ amount: -42.0 }),
    ]);
    expect(totalDebits).toBeCloseTo(-42.0, 5);
    expect(totalCredits).toBe(0);
    expect(net).toBeCloseTo(-42.0, 5);
  });

  // ---------------------------------------------------------------------------
  // Failure / unexpected input
  // ---------------------------------------------------------------------------

  it("handles large transaction lists without overflow", () => {
    const txs = Array.from({ length: 1000 }, (_, i) =>
      makeTx({ amount: i % 2 === 0 ? -1.0 : 1.0 }),
    );
    const { totalDebits, totalCredits, net } = computeSummary(txs);
    expect(totalDebits).toBeCloseTo(-500.0, 3);
    expect(totalCredits).toBeCloseTo(500.0, 3);
    expect(net).toBeCloseTo(0.0, 3);
  });
});
