/**
 * Unit tests for PipelineSnapshot type shape.
 *
 * These tests verify the type contracts at runtime using representative data.
 */

import { describe, it, expect } from "vitest";
import type {
  PipelineSnapshot,
  GeminiSentEntry,
} from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";

/** Helper: minimal valid RawTransaction for testing. */
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

describe("PipelineSnapshot", () => {
  it("accepts a partial snapshot with only some stages", () => {
    const snapshot: PipelineSnapshot = {
      parsed: [makeTx()],
      anonymised: [makeTx({ description: "Anonymised Merchant" })],
    };

    expect(snapshot.parsed).toHaveLength(1);
    expect(snapshot.anonymised).toHaveLength(1);
    expect(snapshot.sent).toBeUndefined();
    expect(snapshot.categorised).toBeUndefined();
    expect(snapshot.restored).toBeUndefined();
  });

  it("accepts a full snapshot with all five stages", () => {
    const tx = makeTx();
    const sentEntry: GeminiSentEntry = {
      index: 0,
      payee: "Test Merchant",
      notes: "",
      transactionType: "POS",
    };

    const snapshot: PipelineSnapshot = {
      parsed: [tx],
      anonymised: [tx],
      sent: [sentEntry],
      categorised: [tx],
      restored: [tx],
    };

    expect(Object.keys(snapshot)).toHaveLength(5);
    expect(snapshot.parsed).toBeDefined();
    expect(snapshot.anonymised).toBeDefined();
    expect(snapshot.sent).toBeDefined();
    expect(snapshot.categorised).toBeDefined();
    expect(snapshot.restored).toBeDefined();
  });

  it("uses GeminiSentEntry[] for the sent stage, not RawTransaction[]", () => {
    const sentEntries: GeminiSentEntry[] = [
      { index: 0, payee: "Merchant A", notes: "lunch", transactionType: "POS" },
      { index: 1, payee: "Person", notes: "", transactionType: "ICT" },
    ];

    const snapshot: PipelineSnapshot = { sent: sentEntries };

    expect(snapshot.sent).toHaveLength(2);
    for (const entry of snapshot.sent!) {
      expect(Object.keys(entry).sort()).toEqual(
        ["index", "notes", "payee", "transactionType"],
      );
      // Verify RawTransaction-specific fields are absent
      expect(entry).not.toHaveProperty("amount");
      expect(entry).not.toHaveProperty("date");
      expect(entry).not.toHaveProperty("originalPII");
      expect(entry).not.toHaveProperty("originalDescription");
    }
  });

  it("accepts an empty snapshot (no stages run yet)", () => {
    const snapshot: PipelineSnapshot = {};

    expect(Object.keys(snapshot)).toHaveLength(0);
  });
});
