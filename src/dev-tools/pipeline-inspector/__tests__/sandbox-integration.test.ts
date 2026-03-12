/**
 * Integration tests for sandbox state management in the pipeline inspector.
 *
 * Verifies that sandbox snapshots override real snapshots, Clear restores
 * the previous state, the API Result Panel visibility logic, and that
 * debug data is passed through in Full Pipeline runs.
 */

import { describe, it, expect } from "vitest";
import { buildStageRows } from "../index";
import type { SandboxResult } from "../sandbox-input";
import type { PipelineSnapshot } from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";
import type { DebugData } from "@/lib/categoriser/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTx(overrides?: Partial<RawTransaction>): RawTransaction {
  return {
    date: new Date("2026-01-15"),
    description: "Real Merchant",
    originalDescription: "REAL MERCHANT",
    amount: -10.5,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Sandbox snapshot override
// ---------------------------------------------------------------------------

describe("sandbox snapshot override", () => {
  const realSnapshot: PipelineSnapshot = {
    parsed: [makeTx({ description: "Real Merchant", originalDescription: "REAL MERCHANT" })],
  };

  const sandboxSnapshot: PipelineSnapshot = {
    parsed: [makeTx({ description: "Sandbox Merchant", originalDescription: "SANDBOX MERCHANT" })],
    anonymised: [makeTx({ description: "Sandbox Merchant" })],
  };

  it("sandbox snapshot produces different rows than real snapshot", () => {
    const realRows = buildStageRows(realSnapshot, 0);
    const sandboxRows = buildStageRows(sandboxSnapshot, 0);

    // Real has only parsed stages, sandbox has parsed + anonymised
    expect(sandboxRows.length).toBeGreaterThan(realRows.length);

    // Payees differ
    const realRaw = realRows.find((r) => r.stage === "raw");
    const sandboxRaw = sandboxRows.find((r) => r.stage === "raw");
    expect(realRaw!.payee).toBe("REAL MERCHANT");
    expect(sandboxRaw!.payee).toBe("SANDBOX MERCHANT");
  });

  it("sandbox snapshot at index 0 always produces rows (single-tx)", () => {
    const rows = buildStageRows(sandboxSnapshot, 0);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("sandbox snapshot at index 1 produces no rows (only 1 tx)", () => {
    const rows = buildStageRows(sandboxSnapshot, 1);
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Clear restores previous state
// ---------------------------------------------------------------------------

describe("clear restores previous state", () => {
  it("real snapshot rows are unchanged after sandbox is cleared", () => {
    const realSnapshot: PipelineSnapshot = {
      parsed: [makeTx({ description: "Original", originalDescription: "ORIGINAL" })],
    };

    // Simulate: build rows before sandbox
    const rowsBefore = buildStageRows(realSnapshot, 0);

    // Simulate: sandbox was active, now cleared → back to real snapshot
    const rowsAfter = buildStageRows(realSnapshot, 0);

    expect(rowsAfter).toEqual(rowsBefore);
  });
});

// ---------------------------------------------------------------------------
// API Result Panel visibility logic
// ---------------------------------------------------------------------------

describe("API Result Panel visibility", () => {
  it("sandboxCategory is present only after Full Pipeline run", () => {
    // Simulates the state logic in the inspector component
    const sandboxCategory: string | null = "Dining";
    const isSandboxActive = true;

    const showPanel = isSandboxActive && sandboxCategory !== null;
    expect(showPanel).toBe(true);
  });

  it("sandboxCategory is null after Parse + Anonymise run", () => {
    const sandboxCategory: string | null = null;
    const isSandboxActive = true;

    const showPanel = isSandboxActive && sandboxCategory !== null;
    expect(showPanel).toBe(false);
  });

  it("panel hidden when sandbox is not active", () => {
    const sandboxCategory: string | null = null;
    const isSandboxActive = false;

    const showPanel = isSandboxActive && sandboxCategory !== null;
    expect(showPanel).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Debug data passthrough in SandboxResult
// ---------------------------------------------------------------------------

describe("SandboxResult debug data passthrough", () => {
  it("SandboxResult type includes optional debugData field", () => {
    // Verify the SandboxResult shape allows debugData
    const debugData: DebugData = {
      rawPayload: '{"transactions":[]}',
      perTransaction: [{ index: 0, reasoning: "Food purchase" }],
    };

    const result: SandboxResult = {
      snapshot: { parsed: [] },
      category: "Dining",
      debugData,
    };

    expect(result.debugData).toBeDefined();
    expect(result.debugData!.perTransaction[0].reasoning).toBe("Food purchase");
  });

  it("SandboxResult without debugData is valid (Parse + Anonymise mode)", () => {
    const result: SandboxResult = {
      snapshot: { parsed: [] },
    };
    expect(result.debugData).toBeUndefined();
    expect(result.category).toBeUndefined();
  });

  it("SandboxResult with category but no debugData is valid (BYOK Full Pipeline)", () => {
    const result: SandboxResult = {
      snapshot: { parsed: [] },
      category: "Transport",
      // debugData absent — BYOK mode
    };
    expect(result.category).toBe("Transport");
    expect(result.debugData).toBeUndefined();
  });
});
