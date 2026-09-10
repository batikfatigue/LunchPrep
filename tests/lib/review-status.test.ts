/**
 * Tests for the review step's derived state helpers: status derivation,
 * counting, search matching, visible-row selection and formatting.
 */

import { describe, it, expect } from "vitest";
import {
  countByStatus,
  deriveReviewStatus,
  formatAmount,
  formatCurrency,
  formatTableDate,
  matchesSearch,
  selectVisibleTransactions,
} from "@/lib/review/status";
import type { RawTransaction } from "@/lib/parsers/types";

const CATEGORIES = ["Groceries", "Dining Out", "Transport", "Other"];

/** Build a minimal RawTransaction with sensible defaults. */
function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date(2024, 8, 14),
    description: "NTUC FAIRPRICE",
    originalDescription: "NTUC FAIRPRICE PTE LTD",
    amount: -32.4,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

describe("deriveReviewStatus", () => {
  it("returns categorised for a specific, known category", () => {
    expect(deriveReviewStatus(makeTx(), "Groceries", CATEGORIES)).toBe("categorised");
  });

  it("returns uncategorised when no category is assigned", () => {
    expect(deriveReviewStatus(makeTx(), undefined, CATEGORIES)).toBe("uncategorised");
  });

  it("returns needs-review for the catch-all category", () => {
    expect(deriveReviewStatus(makeTx(), "Other", CATEGORIES)).toBe("needs-review");
  });

  it("returns needs-review when the parser could not recognise the row", () => {
    const tx = makeTx({ description: "Unknown Format" });
    expect(deriveReviewStatus(tx, "Groceries", CATEGORIES)).toBe("needs-review");
  });

  it("returns needs-review when the category is no longer in the user's list", () => {
    expect(deriveReviewStatus(makeTx(), "Deleted Category", CATEGORIES)).toBe(
      "needs-review",
    );
  });
});

describe("countByStatus", () => {
  it("counts each status and the overall total", () => {
    const txs = [makeTx(), makeTx(), makeTx({ description: "Unknown Format" })];
    const map = new Map([
      [0, "Groceries"],
      [2, "Transport"],
    ]);

    expect(countByStatus(txs, map, CATEGORIES)).toEqual({
      all: 3,
      categorised: 1,
      "needs-review": 1,
      uncategorised: 1,
    });
  });

  it("handles an empty transaction list", () => {
    expect(countByStatus([], new Map(), CATEGORIES)).toEqual({
      all: 0,
      categorised: 0,
      "needs-review": 0,
      uncategorised: 0,
    });
  });
});

describe("matchesSearch", () => {
  it("matches the payee case-insensitively", () => {
    expect(matchesSearch(makeTx(), "fairprice")).toBe(true);
  });

  it("matches on the absolute amount", () => {
    expect(matchesSearch(makeTx({ amount: -32.4 }), "32.40")).toBe(true);
  });

  it("matches everything when the query is blank", () => {
    expect(matchesSearch(makeTx(), "   ")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesSearch(makeTx(), "netflix")).toBe(false);
  });
});

describe("selectVisibleTransactions", () => {
  const txs = [
    makeTx({ description: "NTUC FAIRPRICE", date: new Date(2024, 8, 14) }),
    makeTx({ description: "GRAB SINGAPORE", date: new Date(2024, 8, 13) }),
    makeTx({ description: "STARBUCKS", date: new Date(2024, 8, 12) }),
  ];
  const map = new Map([
    [0, "Groceries"],
    [1, "Transport"],
  ]);

  it("preserves absolute indices while sorting by date", () => {
    const rows = selectVisibleTransactions(txs, map, CATEGORIES, "all", "", "asc");
    expect(rows.map((r) => r.index)).toEqual([2, 1, 0]);
  });

  it("sorts descending when asked", () => {
    const rows = selectVisibleTransactions(txs, map, CATEGORIES, "all", "", "desc");
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2]);
  });

  it("applies the status filter", () => {
    const rows = selectVisibleTransactions(
      txs,
      map,
      CATEGORIES,
      "uncategorised",
      "",
      "asc",
    );
    expect(rows.map((r) => r.index)).toEqual([2]);
  });

  it("applies the search query on top of the filter", () => {
    const rows = selectVisibleTransactions(
      txs,
      map,
      CATEGORIES,
      "all",
      "grab",
      "asc",
    );
    expect(rows.map((r) => r.index)).toEqual([1]);
  });

  it("returns an empty list when nothing matches", () => {
    const rows = selectVisibleTransactions(txs, map, CATEGORIES, "all", "zzz", "asc");
    expect(rows).toEqual([]);
  });
});

describe("formatting", () => {
  it("formats debits with a leading minus", () => {
    expect(formatAmount(-32.4)).toBe("-32.40");
  });

  it("formats credits with thousands separators", () => {
    expect(formatAmount(2800)).toBe("2,800.00");
  });

  it("formats currency with the sign outside the symbol", () => {
    expect(formatCurrency(-3284.16)).toBe("-S$3,284.16");
  });

  it("formats dates as a short US-style date", () => {
    expect(formatTableDate(new Date(2024, 8, 14))).toBe("Sep 14, 2024");
  });
});
