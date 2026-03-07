import { describe, it, expect } from "vitest";
import {
  buildReviewMarkdown,
  extractTransactionPayload,
} from "@/dev-tools/categorisation-debugger/export";
import type { RawTransaction } from "@/lib/parsers/types";
import type { DebugData } from "@/lib/categoriser/client";

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

/** Helper to create debug data with a raw payload and per-transaction reasoning. */
function makeDebugData(
  transactions: Array<{ index: number; payee: string; notes: string; transactionType: string }>,
  reasoning: Array<{ index: number; reasoning: string }>,
): DebugData {
  return {
    rawPayload: JSON.stringify({
      transactions: transactions.map((t) => ({
        index: t.index,
        payee: t.payee,
        notes: t.notes,
        transactionType: t.transactionType,
      })),
    }),
    perTransaction: reasoning,
  };
}

// ---------------------------------------------------------------------------
// buildReviewMarkdown
// ---------------------------------------------------------------------------

describe("buildReviewMarkdown", () => {
  it("includes only annotated transactions in the report", () => {
    const txs = [
      makeTx({ originalDescription: "TX-A" }),
      makeTx({ originalDescription: "TX-B" }),
      makeTx({ originalDescription: "TX-C" }),
    ];
    const categoryMap = new Map<number, string>([
      [0, "Food"],
      [1, "Transport"],
      [2, "Shopping"],
    ]);
    // Only annotate index 1
    const annotations = new Map<number, string>([[1, "Wrong category"]]);

    const md = buildReviewMarkdown(txs, categoryMap, null, annotations);

    expect(md).toContain("TX-B");
    expect(md).not.toContain("TX-A");
    expect(md).not.toContain("TX-C");
  });

  it("produces empty-state message when no annotations exist", () => {
    const txs = [makeTx()];
    const categoryMap = new Map<number, string>([[0, "Food"]]);
    const annotations = new Map<number, string>();

    const md = buildReviewMarkdown(txs, categoryMap, null, annotations);

    expect(md).toContain("No items were flagged for review.");
    expect(md).not.toContain("## 1.");
  });

  it("treats whitespace-only annotations as empty (not flagged)", () => {
    const txs = [makeTx()];
    const categoryMap = new Map<number, string>([[0, "Food"]]);
    const annotations = new Map<number, string>([[0, "   "]]);

    const md = buildReviewMarkdown(txs, categoryMap, null, annotations);

    expect(md).toContain("No items were flagged for review.");
  });

  it("does not include a Raw API Payload section", () => {
    const txs = [makeTx()];
    const categoryMap = new Map<number, string>([[0, "Food"]]);
    const debugData = makeDebugData(
      [{ index: 0, payee: "Test", notes: "", transactionType: "POS" }],
      [{ index: 0, reasoning: "Looks like food" }],
    );
    const annotations = new Map<number, string>([[0, "Check this"]]);

    const md = buildReviewMarkdown(txs, categoryMap, debugData, annotations);

    expect(md).not.toContain("## Raw API Payload");
    expect(md).not.toContain("full JSON batch");
  });

  it("orders fields: Developer Note before metadata table, API blocks, and reasoning", () => {
    const txs = [makeTx({ notes: "PayNow ref" })];
    const categoryMap = new Map<number, string>([[0, "Food"]]);
    const debugData = makeDebugData(
      [{ index: 0, payee: "Test", notes: "PayNow ref", transactionType: "POS" }],
      [{ index: 0, reasoning: "Looks like food" }],
    );
    const annotations = new Map<number, string>([[0, "Needs review"]]);

    const md = buildReviewMarkdown(txs, categoryMap, debugData, annotations);

    const devNotePos = md.indexOf("### Developer Note");
    const detailsPos = md.indexOf("### Details");
    const apiPayloadPos = md.indexOf("### API Payload");
    const apiOutputPos = md.indexOf("### API Output");
    const reasoningPos = md.indexOf("### AI Reasoning");

    // All sections must be present
    expect(devNotePos).toBeGreaterThan(-1);
    expect(detailsPos).toBeGreaterThan(-1);
    expect(apiPayloadPos).toBeGreaterThan(-1);
    expect(apiOutputPos).toBeGreaterThan(-1);
    expect(reasoningPos).toBeGreaterThan(-1);

    // Order: Developer Note → Details → API Payload → API Output → AI Reasoning
    expect(devNotePos).toBeLessThan(detailsPos);
    expect(detailsPos).toBeLessThan(apiPayloadPos);
    expect(apiPayloadPos).toBeLessThan(apiOutputPos);
    expect(apiOutputPos).toBeLessThan(reasoningPos);
  });

  it("uses markdown table format for metadata fields", () => {
    const txs = [makeTx({ transactionCode: "MST", notes: "some note" })];
    const categoryMap = new Map<number, string>([[0, "Shopping"]]);
    const annotations = new Map<number, string>([[0, "flagged"]]);

    const md = buildReviewMarkdown(txs, categoryMap, null, annotations);

    expect(md).toContain("| Field | Value |");
    expect(md).toContain("| :--- | :--- |");
    expect(md).toContain("| **Transaction Code** | `MST` |");
    expect(md).toContain("| **Assigned Category** | Shopping |");
  });

  it("wraps AI reasoning in blockquotes", () => {
    const txs = [makeTx()];
    const categoryMap = new Map<number, string>([[0, "Food"]]);
    const debugData = makeDebugData(
      [{ index: 0, payee: "Test", notes: "", transactionType: "POS" }],
      [{ index: 0, reasoning: "Line one\nLine two" }],
    );
    const annotations = new Map<number, string>([[0, "check"]]);

    const md = buildReviewMarkdown(txs, categoryMap, debugData, annotations);

    expect(md).toContain("> Line one");
    expect(md).toContain("> Line two");
  });

  it("wraps API payload and output in fenced json code blocks", () => {
    const txs = [makeTx()];
    const categoryMap = new Map<number, string>([[0, "Food"]]);
    const debugData = makeDebugData(
      [{ index: 0, payee: "Test", notes: "", transactionType: "POS" }],
      [{ index: 0, reasoning: "reason" }],
    );
    const annotations = new Map<number, string>([[0, "note"]]);

    const md = buildReviewMarkdown(txs, categoryMap, debugData, annotations);

    // Count ```json occurrences — should be at least 2 (payload + output)
    const jsonBlocks = md.match(/```json/g);
    expect(jsonBlocks).not.toBeNull();
    expect(jsonBlocks!.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// extractTransactionPayload
// ---------------------------------------------------------------------------

describe("extractTransactionPayload", () => {
  it("extracts the correct transaction and removes the index field", () => {
    const rawPayload = JSON.stringify({
      transactions: [
        { index: 0, payee: "A", notes: "", transactionType: "POS" },
        { index: 1, payee: "B", notes: "ref", transactionType: "ICT" },
      ],
    });

    const result = extractTransactionPayload(rawPayload, 1);
    expect(result).not.toBeNull();

    const parsed = JSON.parse(result!);
    expect(parsed.payee).toBe("B");
    expect(parsed.index).toBeUndefined();
  });

  it("returns null for undefined payload", () => {
    expect(extractTransactionPayload(undefined, 0)).toBeNull();
  });

  it("returns null when transaction index is not found", () => {
    const rawPayload = JSON.stringify({ transactions: [{ index: 0, payee: "A" }] });
    expect(extractTransactionPayload(rawPayload, 99)).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(extractTransactionPayload("not json", 0)).toBeNull();
  });
});
