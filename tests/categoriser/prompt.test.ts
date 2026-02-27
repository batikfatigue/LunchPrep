import { describe, it, expect } from "vitest";
import { buildPrompt, SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

/** Create a minimal RawTransaction for prompt-builder tests. */
function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date(2026, 1, 23),
    description: "Noodle House",
    originalDescription: "NOODLE HOUSE",
    amount: -9.3,
    transactionCode: "Point-of-Sale Transaction or Proceeds",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// SYSTEM_INSTRUCTION
// ---------------------------------------------------------------------------

describe("SYSTEM_INSTRUCTION", () => {
  it("is a non-empty string", () => {
    expect(typeof SYSTEM_INSTRUCTION).toBe("string");
    expect(SYSTEM_INSTRUCTION.length).toBeGreaterThan(0);
  });

  it("mentions 'Singapore' for geographic context", () => {
    expect(SYSTEM_INSTRUCTION).toContain("Singapore");
  });

  it("mentions 'JSON' to constrain output format", () => {
    expect(SYSTEM_INSTRUCTION).toContain("JSON");
  });

  it("mentions 'Transfers' for default fallback category", () => {
    expect(SYSTEM_INSTRUCTION).toContain("Transfers");
  });
});

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

describe("buildPrompt", () => {
  it("returns a valid JSON string", () => {
    const prompt = buildPrompt([makeTx()], ["Dining", "Other"]);
    expect(() => JSON.parse(prompt)).not.toThrow();
  });

  it("includes valid_categories array matching the input", () => {
    const categories = ["Dining", "Groceries", "Transport"];
    const parsed = JSON.parse(buildPrompt([makeTx()], categories));
    expect(parsed.valid_categories).toEqual(categories);
  });

  it("maps each transaction to the correct shape", () => {
    const tx = makeTx({
      description: "Noodle House",
      notes: "lunch",
      transactionCode: "Point-of-Sale Transaction or Proceeds",
    });
    const parsed = JSON.parse(buildPrompt([tx], ["Dining"]));
    const item = parsed.transactions[0];

    expect(item).toMatchObject({
      index: 0,
      payee: "Noodle House",
      notes: "lunch",
      transactionType: "Point-of-Sale Transaction or Proceeds",
    });
  });

  it("index is 0-based array position", () => {
    const txs = [makeTx(), makeTx(), makeTx()];
    const parsed = JSON.parse(buildPrompt(txs, ["Other"]));
    expect(parsed.transactions[0].index).toBe(0);
    expect(parsed.transactions[1].index).toBe(1);
    expect(parsed.transactions[2].index).toBe(2);
  });

  it("transactionType maps to tx.transactionCode (full description)", () => {
    const txs = [
      makeTx({ transactionCode: "FAST or PayNow Payment / Receipt" }),
      makeTx({ transactionCode: "Funds Transfer" }),
    ];
    const parsed = JSON.parse(buildPrompt(txs, ["Transfers"]));
    expect(parsed.transactions[0].transactionType).toBe(
      "FAST or PayNow Payment / Receipt",
    );
    expect(parsed.transactions[1].transactionType).toBe("Funds Transfer");
  });

  it("handles empty transactions array", () => {
    const parsed = JSON.parse(buildPrompt([], ["Other"]));
    expect(parsed.transactions).toEqual([]);
    expect(parsed.valid_categories).toEqual(["Other"]);
  });

  it("handles empty categories array", () => {
    const parsed = JSON.parse(buildPrompt([makeTx()], []));
    expect(parsed.valid_categories).toEqual([]);
  });

  it("includes notes field even when empty string", () => {
    const tx = makeTx({ notes: "" });
    const parsed = JSON.parse(buildPrompt([tx], ["Other"]));
    expect(parsed.transactions[0].notes).toBe("");
  });

  it("outputs a top-level object with valid_categories and transactions keys", () => {
    const parsed = JSON.parse(buildPrompt([makeTx()], ["Dining"]));
    expect(Object.keys(parsed)).toContain("valid_categories");
    expect(Object.keys(parsed)).toContain("transactions");
  });

  it("transaction count matches input array length", () => {
    const txs = Array.from({ length: 5 }, () => makeTx());
    const parsed = JSON.parse(buildPrompt(txs, ["Other"]));
    expect(parsed.transactions).toHaveLength(5);
  });
});
