/**
 * Unit tests for the Pipeline Inspector export utilities.
 *
 * Tests extractTransactionPayload and buildReviewMarkdown (adapted for
 * the ReviewStatus model).
 */

import { describe, it, expect } from "vitest";
import {
  extractTransactionPayload,
  buildReviewMarkdown,
} from "../export";
import type { ReviewStatus } from "../review-controls";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTx(overrides?: Partial<RawTransaction>): RawTransaction {
  return {
    date: new Date("2026-01-15"),
    description: "Test Merchant",
    originalDescription: "TEST MERCHANT",
    amount: -10.5,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

function makePayload(transactions: Array<Record<string, unknown>>): string {
  return JSON.stringify({ transactions });
}

// ---------------------------------------------------------------------------
// extractTransactionPayload
// ---------------------------------------------------------------------------

describe("extractTransactionPayload", () => {
  it("extracts the matching transaction's payload without the index field", () => {
    const raw = makePayload([
      { index: 0, payee: "Alice Wong", notes: "lunch" },
      { index: 1, payee: "Bob Tan", notes: "" },
    ]);
    const result = extractTransactionPayload(raw, 0);
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.payee).toBe("Alice Wong");
    expect(parsed.notes).toBe("lunch");
    // index field should be removed
    expect(parsed).not.toHaveProperty("index");
  });

  it("returns null when rawPayload is undefined", () => {
    expect(extractTransactionPayload(undefined, 0)).toBeNull();
  });

  it("returns null when rawPayload is empty string", () => {
    expect(extractTransactionPayload("", 0)).toBeNull();
  });

  it("returns null when no matching index exists", () => {
    const raw = makePayload([{ index: 0, payee: "Alice" }]);
    expect(extractTransactionPayload(raw, 5)).toBeNull();
  });

  it("returns null when rawPayload is invalid JSON", () => {
    expect(extractTransactionPayload("not-json", 0)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildReviewMarkdown
// ---------------------------------------------------------------------------

const txList = [
  makeTx({ originalDescription: "GRAB FOOD SG", amount: -15.0, transactionCode: "POS" }),
  makeTx({ originalDescription: "NTUC FAIRPRICE", amount: -42.5, transactionCode: "POS" }),
  makeTx({ originalDescription: "SALARY CREDIT", amount: 3500.0, transactionCode: "CR" }),
];

describe("buildReviewMarkdown — no flagged items", () => {
  it("outputs only header and no-items notice when reviewMap is empty", () => {
    const md = buildReviewMarkdown(txList, new Map(), null, new Map());
    expect(md).toContain("# LunchPrep — Pipeline Inspector Review Report");
    expect(md).toContain("*No items were flagged for review.*");
  });

  it("outputs no-items notice when all entries are OK (not flagged)", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "ok", note: "" }],
      [1, { status: "ok", note: "" }],
    ]);
    const md = buildReviewMarkdown(txList, new Map(), null, reviewMap);
    expect(md).toContain("*No items were flagged for review.*");
    // Should not contain any transaction sections
    expect(md).not.toContain("## 1.");
  });
});

describe("buildReviewMarkdown — with flagged items", () => {
  it("includes only flagged transactions", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "Wrong category" }],
      [1, { status: "ok", note: "" }],
    ]);
    const categoryMap = new Map([[0, "Dining"], [1, "Groceries"]]);
    const md = buildReviewMarkdown(txList, categoryMap, null, reviewMap);

    // Should include flagged tx 0
    expect(md).toContain("GRAB FOOD SG");
    expect(md).toContain("Wrong category");
    expect(md).toContain("Dining");

    // Should NOT include ok tx 1
    expect(md).not.toContain("NTUC FAIRPRICE");
  });

  it("includes developer note before metadata table", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "My dev note" }],
    ]);
    const md = buildReviewMarkdown(txList, new Map(), null, reviewMap);
    const notePos = md.indexOf("My dev note");
    const detailsPos = md.indexOf("### Details");
    expect(notePos).toBeLessThan(detailsPos);
  });

  it("shows flagged count summary", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "note1" }],
      [2, { status: "flagged", note: "note2" }],
    ]);
    const md = buildReviewMarkdown(txList, new Map(), null, reviewMap);
    expect(md).toContain("**2** of 3 transactions flagged");
  });

  it("uses fallback note when note is empty", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "" }],
    ]);
    const md = buildReviewMarkdown(txList, new Map(), null, reviewMap);
    expect(md).toContain("*(no note)*");
  });

  it("includes AI reasoning when debugData is available", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "check this" }],
    ]);
    const debugData = {
      rawPayload: "",
      perTransaction: [{ index: 0, reasoning: "This looks like food." }],
    };
    const md = buildReviewMarkdown(txList, new Map(), debugData, reviewMap);
    expect(md).toContain("This looks like food.");
    expect(md).toContain("> ");
  });

  it("outputs N/A for reasoning when no debugData", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "test" }],
    ]);
    const md = buildReviewMarkdown(txList, new Map(), null, reviewMap);
    expect(md).toContain("### AI Reasoning");
    expect(md).toContain("*N/A*");
  });
});
