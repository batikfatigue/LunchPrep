/**
 * Tests for BYOK key storage helpers in src/lib/categoriser/client.ts.
 *
 * Covers the getBYOKKey/setBYOKKey functions and their interaction with
 * the useLocalStorage JSON serialisation format.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getBYOKKey, setBYOKKey } from "@/lib/categoriser/client";

const STORAGE_KEY = "lunchprep_gemini_key";

describe("getBYOKKey", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no key is stored", () => {
    expect(getBYOKKey()).toBeNull();
  });

  it("returns null when localStorage has JSON-serialised empty string", () => {
    // Reason: useLocalStorage writes JSON.stringify("") = '""' on mount.
    // This must NOT be treated as a valid BYOK key.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(""));
    expect(getBYOKKey()).toBeNull();
  });

  it("returns the key when localStorage has a JSON-serialised key", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify("AIzaSy_test_key"));
    expect(getBYOKKey()).toBe("AIzaSy_test_key");
  });

  it("returns the key for legacy raw string values (backwards compat)", () => {
    // Reason: Older versions of setBYOKKey stored raw strings without JSON.stringify.
    window.localStorage.setItem(STORAGE_KEY, "AIzaSy_raw_key");
    expect(getBYOKKey()).toBe("AIzaSy_raw_key");
  });

  it("returns null for a raw empty string", () => {
    window.localStorage.setItem(STORAGE_KEY, "");
    expect(getBYOKKey()).toBeNull();
  });
});

describe("setBYOKKey", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores the key as JSON in localStorage", () => {
    setBYOKKey("AIzaSy_test_key");
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBe(JSON.stringify("AIzaSy_test_key"));
  });

  it("removes the entry when null is passed", () => {
    setBYOKKey("AIzaSy_test_key");
    setBYOKKey(null);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("removes the entry when empty string is passed", () => {
    setBYOKKey("AIzaSy_test_key");
    setBYOKKey("");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
