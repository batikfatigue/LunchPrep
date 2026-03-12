/**
 * Unit tests for the Pipeline Inspector component and its helpers.
 */

import { describe, it, expect } from "vitest";
import { hasChanged, extractRow, buildStageRows } from "../index";
import type { PipelineSnapshot, GeminiSentEntry } from "@/lib/pipeline-snapshot";
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

// ---------------------------------------------------------------------------
// Diff marker logic
// ---------------------------------------------------------------------------

describe("hasChanged (diff marker logic)", () => {
  it("returns true when field differs from previous stage", () => {
    expect(hasChanged("Anonymised Name", "Original Name")).toBe(true);
  });

  it("returns false when field is unchanged from previous stage", () => {
    expect(hasChanged("Same Value", "Same Value")).toBe(false);
  });

  it("never returns true for first stage (previous is undefined)", () => {
    expect(hasChanged("Any Value", undefined)).toBe(false);
    expect(hasChanged("", undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Placeholder rendering
// ---------------------------------------------------------------------------

describe("PipelineInspector placeholders", () => {
  it("shows placeholder when snapshot is empty", () => {
    const snapshot: PipelineSnapshot = {};
    expect(Object.keys(snapshot)).toHaveLength(0);
  });

  it("shows placeholder when selectedIndex is null", () => {
    const selectedIndex: number | null = null;
    expect(selectedIndex).toBeNull();
  });

  it("does not show placeholder when snapshot has data and index is set", () => {
    const snapshot: PipelineSnapshot = { parsed: [makeTx()] };
    const selectedIndex = 0;
    expect(Object.keys(snapshot).length).toBeGreaterThan(0);
    expect(selectedIndex).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sent stage shape
// ---------------------------------------------------------------------------

describe("sent stage entries", () => {
  it("contain only index, payee, notes, transactionType fields", () => {
    const sentEntries: GeminiSentEntry[] = [
      { index: 0, payee: "Merchant A", notes: "lunch", transactionType: "POS" },
      { index: 1, payee: "Person B", notes: "", transactionType: "ICT" },
    ];

    const snapshot: PipelineSnapshot = { sent: sentEntries };

    for (const entry of snapshot.sent!) {
      const keys = Object.keys(entry).sort();
      expect(keys).toEqual(["index", "notes", "payee", "transactionType"]);

      // Verify no RawTransaction-specific fields
      expect(entry).not.toHaveProperty("amount");
      expect(entry).not.toHaveProperty("date");
      expect(entry).not.toHaveProperty("originalPII");
      expect(entry).not.toHaveProperty("description");
      expect(entry).not.toHaveProperty("originalDescription");
    }
  });
});

// ---------------------------------------------------------------------------
// Parse sub-stage extraction
// ---------------------------------------------------------------------------

describe("extractRow — parse sub-stages", () => {
  const txWithTrace = makeTx({
    originalDescription: "GRAB TRANSPORT 12345678 SI SGP 18FEB",
    description: "Grab Transport",
    notes: "",
    parseTrace: { cleanedPayee: "Grab Transport 12345678" },
  });

  const txWithoutTrace = makeTx({
    originalDescription: "NOODLE HOUSE STALL",
    description: "Noodle House Stall",
    notes: "",
  });

  it("raw stage returns originalDescription as payee and '—' as notes", () => {
    const row = extractRow("raw", [txWithTrace], 0);
    expect(row).not.toBeNull();
    expect(row!.stage).toBe("raw");
    expect(row!.payee).toBe("GRAB TRANSPORT 12345678 SI SGP 18FEB");
    expect(row!.notes).toBe("—");
  });

  it("afterClean stage returns parseTrace.cleanedPayee", () => {
    const row = extractRow("afterClean", [txWithTrace], 0);
    expect(row).not.toBeNull();
    expect(row!.stage).toBe("afterClean");
    expect(row!.payee).toBe("Grab Transport 12345678");
    expect(row!.notes).toBe("");
  });

  it("afterClean returns null when parseTrace is absent", () => {
    const row = extractRow("afterClean", [txWithoutTrace], 0);
    expect(row).toBeNull();
  });

  it("afterStripPII stage returns description", () => {
    const row = extractRow("afterStripPII", [txWithTrace], 0);
    expect(row).not.toBeNull();
    expect(row!.stage).toBe("afterStripPII");
    expect(row!.payee).toBe("Grab Transport");
    expect(row!.notes).toBe("");
  });

  it("returns null for out-of-bounds index", () => {
    expect(extractRow("raw", [txWithTrace], 5)).toBeNull();
    expect(extractRow("afterClean", [txWithTrace], -1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildStageRows — full pipeline
// ---------------------------------------------------------------------------

describe("buildStageRows", () => {
  it("builds 7 rows when all stages and parseTrace are present", () => {
    const tx = makeTx({
      originalDescription: "RAW DESC",
      description: "Clean Desc",
      parseTrace: { cleanedPayee: "Clean Desc With Extra" },
    });
    const anonymised = makeTx({ description: "Alex Tan" });
    const sentEntry: GeminiSentEntry = {
      index: 0,
      payee: "Alex Tan",
      notes: "",
      transactionType: "ICT",
    };
    const categorised = makeTx({ description: "Alex Tan" });
    const restored = makeTx({ description: "Original Name" });

    const snapshots: PipelineSnapshot = {
      parsed: [tx],
      anonymised: [anonymised],
      sent: [sentEntry],
      categorised: [categorised],
      restored: [restored],
    };

    const rows = buildStageRows(snapshots, 0);
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.stage)).toEqual([
      "raw",
      "afterClean",
      "afterStripPII",
      "anonymised",
      "sent",
      "categorised",
      "restored",
    ]);
  });

  it("omits afterClean row when parseTrace is absent", () => {
    const tx = makeTx({
      originalDescription: "RAW DESC",
      description: "Clean Desc",
    });

    const snapshots: PipelineSnapshot = { parsed: [tx] };
    const rows = buildStageRows(snapshots, 0);

    const stageNames = rows.map((r) => r.stage);
    expect(stageNames).toContain("raw");
    expect(stageNames).not.toContain("afterClean");
    expect(stageNames).toContain("afterStripPII");
  });

  it("shows change marker between raw and afterClean when payee differs", () => {
    const tx = makeTx({
      originalDescription: "BUS/MRT 799701767 SI SGP 18FEB",
      description: "Bus/Mrt",
      parseTrace: { cleanedPayee: "Bus/Mrt" },
    });

    const snapshots: PipelineSnapshot = { parsed: [tx] };
    const rows = buildStageRows(snapshots, 0);

    const rawRow = rows.find((r) => r.stage === "raw")!;
    const afterCleanRow = rows.find((r) => r.stage === "afterClean")!;

    expect(hasChanged(afterCleanRow.payee, rawRow.payee)).toBe(true);
  });

  it("shows no change marker when stripPII does not alter payee", () => {
    const tx = makeTx({
      originalDescription: "RAW",
      description: "Noodle Stall",
      parseTrace: { cleanedPayee: "Noodle Stall" },
    });

    const snapshots: PipelineSnapshot = { parsed: [tx] };
    const rows = buildStageRows(snapshots, 0);

    const afterCleanRow = rows.find((r) => r.stage === "afterClean")!;
    const afterStripRow = rows.find((r) => r.stage === "afterStripPII")!;

    expect(hasChanged(afterStripRow.payee, afterCleanRow.payee)).toBe(false);
  });

  it("returns empty array when no snapshots are present", () => {
    const rows = buildStageRows({}, 0);
    expect(rows).toHaveLength(0);
  });
});
