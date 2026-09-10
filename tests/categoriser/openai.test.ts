/**
 * Tests for the OpenAI-compatible provider module
 * (src/lib/categoriser/openai.ts).
 *
 * Covers request construction for the chat completions endpoint, tolerant
 * response parsing, and failure handling. fetch is stubbed via vitest.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callOpenAIChat,
  parseCategorisationContent,
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
} from "@/lib/categoriser/openai";
import { SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";

const PROMPT = JSON.stringify({
  valid_categories: ["Dining", "Transfers"],
  transactions: [{ index: 0, payee: "Noodle House Stall", notes: "", transactionType: "POS" }],
});

function mockFetchOnce(body: unknown, init?: { ok?: boolean; status?: number }) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: init?.status ?? (init?.ok === false ? 500 : 200),
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function chatBody(content: string) {
  return { choices: [{ message: { content } }] };
}

describe("callOpenAIChat", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to /chat/completions with auth, model, and JSON mode", async () => {
    const fetchMock = mockFetchOnce(
      chatBody('[{"index":0,"category":"Dining"}]'),
    );

    const results = await callOpenAIChat(SYSTEM_INSTRUCTION, PROMPT, {
      apiKey: "sk-test",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${DEFAULT_OPENAI_BASE_URL}/chat/completions`);

    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer sk-test");

    const payload = JSON.parse(init.body as string);
    expect(payload.model).toBe(DEFAULT_OPENAI_MODEL);
    expect(payload.temperature).toBe(0);
    expect(payload.response_format).toEqual({ type: "json_object" });
    expect(payload.messages).toEqual([
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: PROMPT },
    ]);

    expect(results).toEqual([{ index: 0, category: "Dining", reasoning: undefined }]);
  });

  it("honours custom baseUrl and model, trimming trailing slashes", async () => {
    const fetchMock = mockFetchOnce(chatBody("[]"));

    await callOpenAIChat(SYSTEM_INSTRUCTION, PROMPT, {
      apiKey: "k",
      baseUrl: "http://localhost:11434/v1/",
      model: "llama3.1",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect(JSON.parse(init.body as string).model).toBe("llama3.1");
  });

  it("accepts object-wrapped results (e.g. { results: [...] })", async () => {
    mockFetchOnce(
      chatBody('{"results":[{"index":0,"category":"Transfers"}]}'),
    );

    const results = await callOpenAIChat(SYSTEM_INSTRUCTION, PROMPT, {
      apiKey: "k",
    });
    expect(results[0]).toMatchObject({ index: 0, category: "Transfers" });
  });

  it("preserves reasoning when the dev instruction requested it", async () => {
    mockFetchOnce(
      chatBody('[{"index":0,"category":"Dining","reasoning":"merchant food stall"}]'),
    );

    const results = await callOpenAIChat(SYSTEM_INSTRUCTION, PROMPT, {
      apiKey: "k",
    });
    expect(results[0].reasoning).toBe("merchant food stall");
  });

  it("throws on non-OK HTTP responses", async () => {
    mockFetchOnce({ error: "unauthorized" }, { ok: false, status: 401 });
    await expect(
      callOpenAIChat(SYSTEM_INSTRUCTION, PROMPT, { apiKey: "k" }),
    ).rejects.toThrow("HTTP 401");
  });

  it("throws when the response is missing choices[0].message.content", async () => {
    mockFetchOnce({ choices: [] });
    await expect(
      callOpenAIChat(SYSTEM_INSTRUCTION, PROMPT, { apiKey: "k" }),
    ).rejects.toThrow();
  });
});

describe("parseCategorisationContent", () => {
  it("parses a bare results array", () => {
    const items = parseCategorisationContent(
      '[{"index":0,"category":"Dining"},{"index":1,"category":"Income"}]',
    );
    expect(items).toHaveLength(2);
  });

  it("throws when no array is present", () => {
    expect(() => parseCategorisationContent('{"category":"Dining"}')).toThrow();
  });

  it("throws on items missing index/category", () => {
    expect(() =>
      parseCategorisationContent('[{"index":0}]'),
    ).toThrow();
  });
});
