/**
 * Tests for BYOK key storage helpers in src/lib/categoriser/client.ts.
 *
 * Covers the getBYOKKey/setBYOKKey functions and their interaction with
 * the useLocalStorage JSON serialisation format.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getBYOKKey,
  setBYOKKey,
  getAIProvider,
  setAIProvider,
  getOpenAIKey,
  setOpenAIKey,
  getBYOKConfig,
  callCategorise,
} from "@/lib/categoriser/client";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";

const STORAGE_KEY = "lunchprep_gemini_key";
const PROVIDER_KEY = "lunchprep_ai_provider";
const OPENAI_KEY = "lunchprep_openai_key";
const OPENAI_BASE_URL_KEY = "lunchprep_openai_base_url";
const OPENAI_MODEL_KEY = "lunchprep_openai_model";

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

describe("getAIProvider / setAIProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to gemini when unset", () => {
    expect(getAIProvider()).toBe("gemini");
  });

  it("returns openai after setAIProvider('openai')", () => {
    setAIProvider("openai");
    expect(getAIProvider()).toBe("openai");
    expect(window.localStorage.getItem(PROVIDER_KEY)).toBe(
      JSON.stringify("openai"),
    );
  });

  it("falls back to gemini for unrecognised stored values", () => {
    window.localStorage.setItem(PROVIDER_KEY, JSON.stringify("anthropic"));
    expect(getAIProvider()).toBe("gemini");
  });
});

describe("getOpenAIKey / setOpenAIKey", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no key is stored", () => {
    expect(getOpenAIKey()).toBeNull();
  });

  it("round-trips a JSON-serialised key", () => {
    setOpenAIKey("sk-test-key");
    expect(getOpenAIKey()).toBe("sk-test-key");
    expect(window.localStorage.getItem(OPENAI_KEY)).toBe(
      JSON.stringify("sk-test-key"),
    );
  });

  it("removes the entry when null is passed", () => {
    setOpenAIKey("sk-test-key");
    setOpenAIKey(null);
    expect(getOpenAIKey()).toBeNull();
  });
});

describe("getBYOKConfig", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no key is set for the selected provider", () => {
    expect(getBYOKConfig()).toBeNull();
  });

  it("returns a gemini config when provider is gemini and a key exists", () => {
    setBYOKKey("AIzaSy_test_key");
    expect(getBYOKConfig()).toEqual({
      provider: "gemini",
      apiKey: "AIzaSy_test_key",
    });
  });

  it("returns an openai config with optional overrides", () => {
    setAIProvider("openai");
    setOpenAIKey("sk-test");
    window.localStorage.setItem(
      OPENAI_BASE_URL_KEY,
      JSON.stringify("https://openrouter.ai/api/v1"),
    );
    window.localStorage.setItem(OPENAI_MODEL_KEY, JSON.stringify("gpt-4o"));

    expect(getBYOKConfig()).toEqual({
      provider: "openai",
      apiKey: "sk-test",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "gpt-4o",
    });
  });

  it("returns null when provider is openai but no openai key exists", () => {
    setAIProvider("openai");
    setBYOKKey("AIzaSy_test_key"); // gemini key must not be used for openai
    expect(getBYOKConfig()).toBeNull();
  });
});

describe("callCategorise routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the server proxy when byok is explicitly null, ignoring stored keys", async () => {
    setAIProvider("openai");
    setOpenAIKey("sk-test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await callCategorise([], DEFAULT_CATEGORIES, null);

    expect(res.results).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/categorise");
  });

  it("relays an OpenAI BYOK call through the proxy when the endpoint is unreachable", async () => {
    const fetchMock = vi
      .fn()
      // Direct call: fetch rejects before any HTTP response (CORS block).
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      // Relay: the server proxy answers.
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ results: [{ index: 0, category: "Dining" }] }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const res = await callCategorise(
      [
        {
          date: "01 Jan 2026",
          description: "Noodle House",
          notes: "",
          transactionCode: "POS",
          amount: -10,
        },
      ],
      DEFAULT_CATEGORIES,
      {
        provider: "openai",
        apiKey: "sk-relay",
        baseUrl: "https://blocked.example.com/v1",
        model: "llama3",
      },
    );

    expect(res.results).toEqual([{ index: 0, category: "Dining" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // First call went straight to the provider endpoint.
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://blocked.example.com/v1/chat/completions",
    );
    // Relay call hits the proxy carrying the BYOK credentials.
    const [relayUrl, relayInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(relayUrl).toBe("/api/categorise");
    const relayBody = JSON.parse(relayInit.body as string);
    expect(relayBody.byok).toEqual({
      provider: "openai",
      apiKey: "sk-relay",
      baseUrl: "https://blocked.example.com/v1",
      model: "llama3",
    });
  });

  it("does not relay on HTTP errors (e.g. 401) — the real message propagates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "bad key" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      callCategorise(
        [
          {
            date: new Date("2026-01-01"),
            description: "Noodle House",
            originalDescription: "Noodle House",
            amount: -10,
            transactionCode: "POS",
            notes: "",
            originalPII: {},
          },
        ],
        DEFAULT_CATEGORIES,
        { provider: "openai", apiKey: "sk-bad" },
      ),
    ).rejects.toThrow("HTTP 401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
