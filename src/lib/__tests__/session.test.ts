/**
 * Unit tests for src/lib/session.ts
 *
 * Covers: serialise/deserialise round-trip, Date rehydration,
 * Map reconstruction, corrupt JSON handling, version mismatch rejection.
 */

import { describe, it, expect } from "vitest";
import {
  serialiseSession,
  deserialiseSession,
  restoreCategoryMap,
  SESSION_VERSION,
} from "@/lib/session";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTransaction(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date("2026-03-01"),
    description: "KOUFU PTE LTD",
    originalDescription: "KOUFU PTE LTD 123",
    amount: -12.5,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

const txs: RawTransaction[] = [
  makeTransaction(),
  makeTransaction({ date: new Date("2026-03-05"), description: "GRAB FOOD", amount: -8.0 }),
];

const categoryMap = new Map<number, string>([
  [0, "Food & Drink"],
  [1, "Transport"],
]);

// ---------------------------------------------------------------------------
// serialiseSession
// ---------------------------------------------------------------------------

describe("serialiseSession", () => {
  it("produces a valid JSON string", () => {
    const json = serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap });
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes session version", () => {
    const parsed = JSON.parse(serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap }));
    expect(parsed.version).toBe(SESSION_VERSION);
  });

  it("serialises Map as entries array", () => {
    const parsed = JSON.parse(serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap }));
    expect(parsed.state.categoryMap).toEqual([[0, "Food & Drink"], [1, "Transport"]]);
  });

  it("stores catStatus as 'done'", () => {
    const parsed = JSON.parse(serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap }));
    expect(parsed.state.catStatus).toBe("done");
  });

  it("captures meta filename and txnCount", () => {
    const parsed = JSON.parse(serialiseSession({ filename: "dbs_mar2026.csv", transactions: txs, categoryMap }));
    expect(parsed.meta.filename).toBe("dbs_mar2026.csv");
    expect(parsed.meta.txnCount).toBe(2);
  });

  it("stores savedAt as an ISO 8601 string", () => {
    const parsed = JSON.parse(serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap }));
    expect(new Date(parsed.meta.savedAt).toString()).not.toBe("Invalid Date");
  });
});

// ---------------------------------------------------------------------------
// deserialiseSession
// ---------------------------------------------------------------------------

describe("deserialiseSession", () => {
  it("round-trips: deserialised transactions match original", () => {
    const json = serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap });
    const session = deserialiseSession(json);
    expect(session).not.toBeNull();
    expect(session!.state.transactions).toHaveLength(2);
    expect(session!.state.transactions[0].description).toBe("KOUFU PTE LTD");
  });

  it("rehydrates Date objects from ISO strings", () => {
    const json = serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap });
    const session = deserialiseSession(json);
    expect(session!.state.transactions[0].date).toBeInstanceOf(Date);
    expect(session!.state.transactions[0].date.getFullYear()).toBe(2026);
    expect(session!.state.transactions[0].date.getMonth()).toBe(2); // March = 2 (0-indexed)
    expect(session!.state.transactions[0].date.getDate()).toBe(1);
  });

  it("preserves the date value exactly through round-trip", () => {
    const json = serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap });
    const session = deserialiseSession(json);
    expect(session!.state.transactions[0].date.toISOString()).toBe(
      new Date("2026-03-01").toISOString(),
    );
  });

  it("restores categoryMap entries array", () => {
    const json = serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap });
    const session = deserialiseSession(json);
    const restored = restoreCategoryMap(session!.state.categoryMap);
    expect(restored.get(0)).toBe("Food & Drink");
    expect(restored.get(1)).toBe("Transport");
  });

  it("returns null for null input", () => {
    expect(deserialiseSession(null)).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    expect(deserialiseSession("not-json-at-all")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(deserialiseSession("")).toBeNull();
  });

  it("returns null when version mismatches", () => {
    const json = serialiseSession({ filename: "dbs.csv", transactions: txs, categoryMap });
    const obj = JSON.parse(json);
    obj.version = 999;
    expect(deserialiseSession(JSON.stringify(obj))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// restoreCategoryMap
// ---------------------------------------------------------------------------

describe("restoreCategoryMap", () => {
  it("reconstructs a Map from entries array", () => {
    const entries: [number, string][] = [[0, "Groceries"], [2, "Bills"]];
    const map = restoreCategoryMap(entries);
    expect(map).toBeInstanceOf(Map);
    expect(map.get(0)).toBe("Groceries");
    expect(map.get(2)).toBe("Bills");
    expect(map.size).toBe(2);
  });

  it("returns an empty Map for empty entries", () => {
    const map = restoreCategoryMap([]);
    expect(map.size).toBe(0);
  });
});
