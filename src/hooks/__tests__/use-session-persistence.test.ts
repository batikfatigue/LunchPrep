/**
 * Unit tests for useSessionPersistence hook.
 *
 * Covers: mount with existing session, mount with no session,
 * mount with corrupt data, discard, debounced write behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessionPersistence } from "@/hooks/use-session-persistence";
import { serialiseSession, SESSION_KEY } from "@/lib/session";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTx(description = "KOUFU PTE LTD"): RawTransaction {
  return {
    date: new Date("2026-03-01"),
    description,
    originalDescription: description,
    amount: -12.5,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
  };
}

const transactions = [makeTx("KOUFU"), makeTx("GRAB")];
const categoryMap = new Map<number, string>([[0, "Food"], [1, "Transport"]]);

function makeValidSession() {
  return serialiseSession({ filename: "dbs.csv", transactions, categoryMap });
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    store,
    mock: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    },
  };
}

// ---------------------------------------------------------------------------
// Mount tests — NO fake timers (waitFor uses real setTimeout internally)
// ---------------------------------------------------------------------------

describe("useSessionPersistence — mount", () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    lsMock = makeLocalStorageMock();
    vi.stubGlobal("localStorage", lsMock.mock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns savedSession=null when no session stored", async () => {
    const { result } = renderHook(() => useSessionPersistence(null));
    await waitFor(() => {
      // isHydrated.current is set to true after the read effect runs
      // After that, savedSession should remain null
      expect(result.current.savedSession).toBeNull();
    });
  });

  it("returns savedSession with metadata when a valid session exists", async () => {
    lsMock.store[SESSION_KEY] = makeValidSession();
    const { result } = renderHook(() => useSessionPersistence(null));
    await waitFor(() => expect(result.current.savedSession).not.toBeNull());
    expect(result.current.savedSession!.meta.filename).toBe("dbs.csv");
    expect(result.current.savedSession!.meta.txnCount).toBe(2);
  });

  it("returns savedSession=null for corrupt JSON", async () => {
    lsMock.store[SESSION_KEY] = "not-json";
    const { result } = renderHook(() => useSessionPersistence(null));
    // Corrupt data is silently discarded; savedSession stays null
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.savedSession).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Restore tests
// ---------------------------------------------------------------------------

describe("useSessionPersistence — restore", () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    lsMock = makeLocalStorageMock();
    vi.stubGlobal("localStorage", lsMock.mock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restore() returns hydrated transactions and categoryMap", async () => {
    lsMock.store[SESSION_KEY] = makeValidSession();
    const { result } = renderHook(() => useSessionPersistence(null));
    await waitFor(() => expect(result.current.savedSession).not.toBeNull());

    const restored = result.current.restore();
    expect(restored).not.toBeNull();
    expect(restored!.transactions).toHaveLength(2);
    expect(restored!.transactions[0].date).toBeInstanceOf(Date);
    expect(restored!.categoryMap.get(0)).toBe("Food");
  });

  it("restore() returns null when no savedSession", async () => {
    const { result } = renderHook(() => useSessionPersistence(null));
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.restore()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Discard tests
// ---------------------------------------------------------------------------

describe("useSessionPersistence — discard", () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    lsMock = makeLocalStorageMock();
    vi.stubGlobal("localStorage", lsMock.mock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("discard() removes session from localStorage and clears savedSession", async () => {
    lsMock.store[SESSION_KEY] = makeValidSession();
    const { result } = renderHook(() => useSessionPersistence(null));
    await waitFor(() => expect(result.current.savedSession).not.toBeNull());

    act(() => { result.current.discard(); });

    expect(result.current.savedSession).toBeNull();
    expect(lsMock.store[SESSION_KEY]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Debounced write tests — use fake timers only here
// ---------------------------------------------------------------------------

describe("useSessionPersistence — debounced writes", () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    lsMock = makeLocalStorageMock();
    vi.stubGlobal("localStorage", lsMock.mock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("writes to localStorage after 1s debounce when catStatus is done", async () => {
    const { result } = renderHook(() =>
      useSessionPersistence({
        filename: "dbs.csv",
        transactions,
        categoryMap,
        catStatus: "done",
      }),
    );

    // Mark hydrated manually by flushing the mount effect
    await act(async () => {
      await Promise.resolve();
    });

    // Before debounce fires, nothing written
    expect(lsMock.store[SESSION_KEY]).toBeUndefined();

    // Advance time past debounce
    await act(async () => {
      vi.advanceTimersByTime(1100);
      await Promise.resolve();
    });

    expect(lsMock.store[SESSION_KEY]).toBeDefined();
    const stored = JSON.parse(lsMock.store[SESSION_KEY]);
    expect(stored.meta.filename).toBe("dbs.csv");
  });

  it("does NOT write when catStatus is not done", async () => {
    renderHook(() =>
      useSessionPersistence({
        filename: "dbs.csv",
        transactions,
        categoryMap,
        catStatus: "loading",
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(1100);
      await Promise.resolve();
    });

    expect(lsMock.store[SESSION_KEY]).toBeUndefined();
  });
});
