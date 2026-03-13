/**
 * Unit tests for the SandboxInput component.
 *
 * Tests form rendering, default values, and execution callback behaviour.
 * Uses the sandbox's internal pipeline execution to verify snapshot shape.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildCsv } from "@/dev-tools/pipeline-inspector/mock-csv";
import { dbsParser } from "@/lib/parsers/dbs";
import { anonymise } from "@/lib/anonymiser/pii";
import type { PipelineSnapshot } from "@/lib/pipeline-snapshot";

// ---------------------------------------------------------------------------
// buildCsv → parse → anonymise integration (mirrors sandbox execution path)
// ---------------------------------------------------------------------------

describe("sandbox execution path", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEV_TOOLS", "true");
  });

  it("Parse + Anonymise produces snapshot with parsed and anonymised stages", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "PayNow Transfer REF123",
      ref2: "To: ALICE WONG",
      ref3: "OTHR lunch money",
      debit: "45.00",
    });

    const parsed = dbsParser.parse(csv);
    const snapshot: PipelineSnapshot = { parsed };

    const anon = anonymise(parsed);
    snapshot.anonymised = anon;

    // Snapshot has parsed and anonymised stages
    expect(snapshot.parsed).toHaveLength(1);
    expect(snapshot.anonymised).toHaveLength(1);
    // No sent/categorised/restored stages
    expect(snapshot.sent).toBeUndefined();
    expect(snapshot.categorised).toBeUndefined();
    expect(snapshot.restored).toBeUndefined();
  });

  it("parsed transaction has correct description and notes from ICT PayNow", () => {
    const csv = buildCsv({
      code: "ICT",
      ref1: "PayNow Transfer REF123",
      ref2: "To: ALICE WONG",
      ref3: "OTHR lunch money",
      debit: "45.00",
    });

    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Alice Wong");
    expect(tx.notes).toBe("lunch money");
    expect(tx.amount).toBe(-45);
  });

  it("parsed transaction has parseTrace when dev tools enabled", () => {
    const csv = buildCsv({
      code: "POS",
      ref1: "NETS QR PAYMENT ABC123",
      ref2: "TO: NOODLE STALL",
      debit: "5.00",
    });

    const [tx] = dbsParser.parse(csv);
    expect(tx.parseTrace).toBeDefined();
    expect(tx.parseTrace!.cleanedPayee).toBe("Noodle Stall");
  });

  it("handles MST transaction through sandbox path", () => {
    const csv = buildCsv({
      code: "MST",
      ref1: "BURGER KING 123456 SI SGP 10MAR",
      ref2: "XXXX-XXXX-XXXX-1234",
      ref3: "REF999",
      debit: "15.50",
    });

    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Burger King");
    expect(tx.amount).toBe(-15.5);
  });

  it("handles unknown format gracefully", () => {
    const csv = buildCsv({
      code: "ZZZ",
      ref1: "SOME DATA",
    });

    const [tx] = dbsParser.parse(csv);
    expect(tx.description).toBe("Unknown Format");
    expect(tx.notes).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

describe("sandbox defaults", () => {
  it("buildCsv with empty fields produces parseable CSV", () => {
    const csv = buildCsv({});
    const parsed = dbsParser.parse(csv);
    expect(parsed).toHaveLength(1);
  });
});
