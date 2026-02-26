import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  anonymise,
  restore,
  isBusinessName,
  isTransferTransaction,
  loadWhitelist,
} from "@/lib/anonymiser/pii";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Known transaction code strings produced by the DBS parser (from dbs_codes.json). */
const CODES = {
  ICT: "FAST or PayNow Payment / Receipt",
  ITR: "Funds Transfer",
  POS: "Point-of-Sale Transaction or Proceeds",
  MST: "Debit Card Transaction",
};

/**
 * Create a test RawTransaction with sensible defaults.
 * Defaults to an ICT (transfer) transaction with a personal name.
 */
function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date(2026, 1, 23),
    description: "Alice Wong",
    originalDescription: "ALICE WONG",
    amount: -50.0,
    transactionCode: CODES.ICT,
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

/** Create a POS (card payment) transaction. */
function makePOSTx(description = "Noodle House"): RawTransaction {
  return makeTx({
    description,
    originalDescription: description.toUpperCase(),
    transactionCode: CODES.POS,
  });
}

// ---------------------------------------------------------------------------
// isTransferTransaction
// ---------------------------------------------------------------------------

describe("isTransferTransaction", () => {
  it("returns true for ICT full description", () => {
    expect(isTransferTransaction(CODES.ICT)).toBe(true);
  });

  it("returns true for ITR full description", () => {
    expect(isTransferTransaction(CODES.ITR)).toBe(true);
  });

  it("returns false for POS full description", () => {
    expect(isTransferTransaction(CODES.POS)).toBe(false);
  });

  it("returns false for MST full description", () => {
    expect(isTransferTransaction(CODES.MST)).toBe(false);
  });

  it("returns false for short codes (gate should not match 'ICT')", () => {
    // Reason: DBS parser stores full descriptions, not short codes.
    expect(isTransferTransaction("ICT")).toBe(false);
    expect(isTransferTransaction("ITR")).toBe(false);
  });

  it("returns false for unknown code", () => {
    expect(isTransferTransaction("")).toBe(false);
    expect(isTransferTransaction("Some Unknown Code")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isBusinessName
// ---------------------------------------------------------------------------

describe("isBusinessName", () => {
  it("returns true for 'ABC PTE LTD'", () => {
    expect(isBusinessName("ABC PTE LTD")).toBe(true);
  });

  it("returns true for 'Food Enterprise'", () => {
    expect(isBusinessName("Food Enterprise")).toBe(true);
  });

  it("returns true for 'Grab Pte Ltd' (mixed case)", () => {
    expect(isBusinessName("Grab Pte Ltd")).toBe(true);
  });

  it("returns true for 'Lim Trading Company'", () => {
    expect(isBusinessName("Lim Trading Company")).toBe(true);
  });

  it("returns true for 'Hawker Cafe'", () => {
    expect(isBusinessName("Hawker Cafe")).toBe(true);
  });

  it("returns true for 'SG Holdings'", () => {
    expect(isBusinessName("SG Holdings")).toBe(true);
  });

  it("returns false for 'Alice Wong'", () => {
    expect(isBusinessName("Alice Wong")).toBe(false);
  });

  it("returns false for 'John Tan'", () => {
    expect(isBusinessName("John Tan")).toBe(false);
  });

  it("returns false for 'Dbs'", () => {
    expect(isBusinessName("Dbs")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isBusinessName("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// anonymise
// ---------------------------------------------------------------------------

describe("anonymise", () => {
  it("replaces personal name in ICT transaction with a mock name", () => {
    const txs = [makeTx({ description: "Alice Wong" })];
    const result = anonymise(txs);
    expect(result[0].description).not.toBe("Alice Wong");
    expect(result[0].description).toBeTruthy();
  });

  it("replaces personal name in ITR transaction", () => {
    const txs = [makeTx({ description: "Bob Lim", transactionCode: CODES.ITR })];
    const result = anonymise(txs);
    expect(result[0].description).not.toBe("Bob Lim");
  });

  it("leaves POS transaction description unchanged", () => {
    const txs = [makePOSTx("Noodle House")];
    const result = anonymise(txs);
    expect(result[0].description).toBe("Noodle House");
    expect(result[0].originalPII).toEqual({});
  });

  it("leaves MST transaction description unchanged", () => {
    const txs = [makeTx({
      description: "Bus/Mrt",
      transactionCode: CODES.MST,
    })];
    const result = anonymise(txs);
    expect(result[0].description).toBe("Bus/Mrt");
    expect(result[0].originalPII).toEqual({});
  });

  it("leaves business name in ICT transaction unchanged", () => {
    const txs = [makeTx({ description: "Grab Pte Ltd" })];
    const result = anonymise(txs);
    expect(result[0].description).toBe("Grab Pte Ltd");
    expect(result[0].originalPII).toEqual({});
  });

  it("populates originalPII with { mockName: originalName }", () => {
    const txs = [makeTx({ description: "Alice Wong" })];
    const result = anonymise(txs);
    const { description, originalPII } = result[0];
    // The key is the mock name, value is the original
    expect(originalPII[description]).toBe("Alice Wong");
  });

  it("assigns the same mock name to the same original name across multiple transactions", () => {
    const txs = [
      makeTx({ description: "Alice Wong" }),
      makeTx({ description: "Bob Lim" }),
      makeTx({ description: "Alice Wong" }), // duplicate
    ];
    const result = anonymise(txs);
    expect(result[0].description).toBe(result[2].description);
    expect(result[0].description).not.toBe(result[1].description);
  });

  it("handles empty transactions array", () => {
    expect(anonymise([])).toEqual([]);
  });

  it("skips transactions with empty description", () => {
    const txs = [makeTx({ description: "" })];
    const result = anonymise(txs);
    expect(result[0].description).toBe("");
    expect(result[0].originalPII).toEqual({});
  });

  it("respects the whitelist — does not anonymise whitelisted names", () => {
    const whitelist = new Set(["ALICE WONG"]);
    const txs = [makeTx({ description: "Alice Wong" })];
    const result = anonymise(txs, whitelist);
    expect(result[0].description).toBe("Alice Wong");
    expect(result[0].originalPII).toEqual({});
  });

  it("does not mutate the original transaction objects", () => {
    const original = makeTx({ description: "Alice Wong" });
    const txs = [original];
    anonymise(txs);
    // Original object must be unchanged
    expect(original.description).toBe("Alice Wong");
    expect(original.originalPII).toEqual({});
  });

  it("cycles through mock name pool when more than pool size unique names", () => {
    // More than 15 unique names should not throw — cycling kicks in
    const txs = Array.from({ length: 20 }, (_, i) =>
      makeTx({ description: `Person ${i}` }),
    );
    const result = anonymise(txs);
    expect(result).toHaveLength(20);
    result.forEach((tx) => {
      expect(tx.description).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// restore
// ---------------------------------------------------------------------------

describe("restore", () => {
  it("restores original name from originalPII", () => {
    const mockName = "Alex Tan";
    const txs = [
      makeTx({
        description: mockName,
        originalPII: { [mockName]: "Alice Wong" },
      }),
    ];
    const result = restore(txs);
    expect(result[0].description).toBe("Alice Wong");
  });

  it("leaves non-anonymised transactions unchanged", () => {
    const txs = [makePOSTx("Noodle House")];
    const result = restore(txs);
    expect(result[0].description).toBe("Noodle House");
  });

  it("handles transactions with empty originalPII", () => {
    const txs = [makeTx({ description: "Alice Wong", originalPII: {} })];
    const result = restore(txs);
    expect(result[0].description).toBe("Alice Wong");
  });

  it("does not mutate the original transaction objects", () => {
    const mockName = "Alex Tan";
    const original = makeTx({
      description: mockName,
      originalPII: { [mockName]: "Alice Wong" },
    });
    restore([original]);
    // Original object must be unchanged
    expect(original.description).toBe(mockName);
  });

  it("round-trips: anonymise then restore returns original description", () => {
    const txs = [
      makeTx({ description: "Alice Wong" }),
      makeTx({ description: "Bob Lim", transactionCode: CODES.ITR }),
      makePOSTx("Noodle House"),
    ];
    const anonymised = anonymise(txs, new Set());
    const restored = restore(anonymised);

    expect(restored[0].description).toBe("Alice Wong");
    expect(restored[1].description).toBe("Bob Lim");
    expect(restored[2].description).toBe("Noodle House"); // unchanged
  });
});

// ---------------------------------------------------------------------------
// loadWhitelist (browser context)
// ---------------------------------------------------------------------------

describe("loadWhitelist", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty set when localStorage has no whitelist key", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    expect(loadWhitelist().size).toBe(0);
  });

  it("returns names as uppercase set", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify(["Alice Wong", "eclipse"]),
    );
    const wl = loadWhitelist();
    expect(wl.has("ALICE WONG")).toBe(true);
    expect(wl.has("ECLIPSE")).toBe(true);
  });

  it("returns empty set for malformed JSON", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      "not-json{{{",
    );
    expect(loadWhitelist().size).toBe(0);
  });
});
