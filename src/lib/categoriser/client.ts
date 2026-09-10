/**
 * Client-side categorisation entry point.
 *
 * Routes categorisation calls to either:
 * - The /api/categorise server proxy (default, uses server-side AI key)
 * - The AI provider directly from the browser (BYOK mode, user's own key):
 *   Gemini, or any OpenAI-compatible chat completions endpoint.
 *
 * This module runs in the browser only. Do not import it in server-side code.
 *
 * @see specs/ai-categorisation.md for BYOK mode description
 */

import { buildPrompt, SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import {
  callOpenAIChat,
  OpenAIEndpointUnreachableError,
} from "@/lib/categoriser/openai";
import type { RawTransaction } from "@/lib/parsers/types";

/** Supported AI providers for categorisation. */
export type AiProvider = "gemini" | "openai";

/** localStorage key for the user's personal Gemini API key (BYOK mode). */
const BYOK_STORAGE_KEY = "lunchprep_gemini_key";

/** localStorage key for the selected BYOK provider. */
const PROVIDER_STORAGE_KEY = "lunchprep_ai_provider";

/** localStorage keys for the OpenAI-compatible BYOK settings. */
const OPENAI_KEY_STORAGE_KEY = "lunchprep_openai_key";
const OPENAI_BASE_URL_STORAGE_KEY = "lunchprep_openai_base_url";
const OPENAI_MODEL_STORAGE_KEY = "lunchprep_openai_model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single categorisation result returned by the service. */
export interface CategorisationResult {
  /** 0-based index matching the position in the input transactions array. */
  index: number;
  /** Assigned category string (must be one of the requested categories). */
  category: string;
}

/**
 * Debug data returned alongside categorisation results in dev mode.
 * Only populated when NEXT_PUBLIC_DEV_TOOLS === 'true'.
 */
export interface DebugData {
  /** The exact JSON string that was sent as the user prompt to Gemini. */
  rawPayload: string;
  /** Per-transaction reasoning strings from Gemini (one entry per transaction). */
  perTransaction: Array<{ index: number; reasoning: string }>;
}

/** Full response from callCategorise, including optional dev-mode debug data. */
export interface CategoriseResponse {
  results: CategorisationResult[];
  debug?: DebugData;
}

/** Shape of the request body sent to /api/categorise. */
interface ProxyRequestBody {
  transactions: Array<{
    index: number;
    payee: string;
    notes: string;
    transactionType: string;
  }>;
  categories: string[];
  /**
   * BYOK credentials relayed to the server when the provider endpoint cannot
   * be reached directly from the browser (e.g. no CORS headers). When absent,
   * the proxy uses its own server-side env vars.
   */
  byok?: {
    provider: AiProvider;
    apiKey: string;
    baseUrl?: string;
    model?: string;
  };
}

/** Shape of the JSON response from /api/categorise. */
interface ProxyResponseBody {
  results: CategorisationResult[];
  debug?: DebugData;
}

/**
 * Fully-resolved BYOK configuration for a direct browser → provider call.
 * `baseUrl` and `model` apply only when `provider` is "openai".
 */
export interface BYOKConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// ---------------------------------------------------------------------------
// BYOK helpers
// ---------------------------------------------------------------------------

/**
 * Read a string value from localStorage, tolerating both the JSON-serialised
 * format written by useLocalStorage/setBYOKKey and legacy raw strings.
 *
 * @param key - localStorage key to read.
 * @returns The stored string, or null when unset, empty, or non-string.
 */
function readStoredString(key: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  try {
    // Reason: useLocalStorage writes JSON.stringify(value), so the stored
    // empty string is '""' (2 quote chars). We must JSON.parse to get the
    // real value, then treat empty strings as "no value".
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" && parsed.length > 0 ? parsed : null;
  } catch {
    // Legacy raw string (not JSON-wrapped) — return as-is if non-empty.
    return raw.length > 0 ? raw : null;
  }
}

/**
 * Write a string value to localStorage using the same JSON serialisation
 * as useLocalStorage. Passing null or "" removes the entry entirely.
 *
 * @param key - localStorage key to write.
 * @param value - String to store. Pass null or "" to clear.
 */
function writeStoredString(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  if (value === null || value === "") {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Retrieve the selected BYOK provider from localStorage.
 *
 * @returns "openai" when the user selected an OpenAI-compatible provider,
 *   "gemini" otherwise (default).
 */
export function getAIProvider(): AiProvider {
  return readStoredString(PROVIDER_STORAGE_KEY) === "openai"
    ? "openai"
    : "gemini";
}

/**
 * Persist the selected BYOK provider to localStorage.
 *
 * @param provider - Provider to store.
 */
export function setAIProvider(provider: AiProvider): void {
  writeStoredString(PROVIDER_STORAGE_KEY, provider);
}

/**
 * Retrieve the user's BYOK OpenAI-compatible API key from localStorage.
 *
 * @returns API key string, or null if not set.
 */
export function getOpenAIKey(): string | null {
  return readStoredString(OPENAI_KEY_STORAGE_KEY);
}

/**
 * Store a BYOK OpenAI-compatible API key in localStorage.
 *
 * @param key - API key to store. Pass null or "" to clear.
 */
export function setOpenAIKey(key: string | null): void {
  writeStoredString(OPENAI_KEY_STORAGE_KEY, key);
}

/**
 * Retrieve the BYOK OpenAI-compatible base URL override from localStorage.
 *
 * @returns Base URL string, or null to use the default endpoint.
 */
export function getOpenAIBaseUrl(): string | null {
  return readStoredString(OPENAI_BASE_URL_STORAGE_KEY);
}

/**
 * Retrieve the BYOK OpenAI-compatible model override from localStorage.
 *
 * @returns Model name, or null to use the default model.
 */
export function getOpenAIModel(): string | null {
  return readStoredString(OPENAI_MODEL_STORAGE_KEY);
}

/**
 * Build the active BYOK configuration from localStorage.
 *
 * @returns A BYOKConfig for the selected provider when its key is set,
 *   or null when BYOK is not configured (caller should use the proxy).
 */
export function getBYOKConfig(): BYOKConfig | null {
  const provider = getAIProvider();
  if (provider === "openai") {
    const apiKey = getOpenAIKey();
    if (!apiKey) return null;
    return {
      provider,
      apiKey,
      baseUrl: getOpenAIBaseUrl() ?? undefined,
      model: getOpenAIModel() ?? undefined,
    };
  }
  const apiKey = getBYOKKey();
  return apiKey ? { provider, apiKey } : null;
}

/**
 * Retrieve the user's BYOK Gemini API key from localStorage.
 *
 * Returns null in non-browser environments, when no key is stored, or when
 * the stored value is an empty string. Handles both JSON-serialised values
 * (written by useLocalStorage) and legacy raw strings for backwards compat.
 *
 * @returns API key string, or null if not set.
 */
export function getBYOKKey(): string | null {
  return readStoredString(BYOK_STORAGE_KEY);
}

/**
 * Store a BYOK Gemini API key in localStorage.
 *
 * Uses JSON.stringify to match the serialisation format of useLocalStorage.
 * Passing null or an empty string removes the entry entirely.
 *
 * @param key - Gemini API key to store. Pass null or "" to clear.
 */
export function setBYOKKey(key: string | null): void {
  writeStoredString(BYOK_STORAGE_KEY, key);
}

// ---------------------------------------------------------------------------
// Categorisation
// ---------------------------------------------------------------------------

/**
 * Send anonymised transactions to the categorisation service.
 *
 * Routing logic:
 * - If a BYOK config is passed explicitly, or one is available in
 *   localStorage via getBYOKConfig(): calls the selected provider (Gemini or
 *   OpenAI-compatible) directly from the browser, bypassing the server proxy.
 * - Otherwise: calls the /api/categorise server proxy.
 *
 * Throws on API failure to allow the caller to show an error state.
 *
 * @param transactions - Anonymised RawTransaction[] (PII must be masked first).
 * @param categories - Category list. Defaults to DEFAULT_CATEGORIES.
 * @param byok - Explicit BYOK config override (useful for testing). Pass
 *   `undefined` to auto-detect from localStorage via getBYOKConfig(), or
 *   `null` to force the server proxy even when a BYOK key is stored.
 * @returns Object with `results` array and optional `debug` data (dev mode only).
 * @throws Error with message "RATE_LIMITED:<retryAfter>" on HTTP 429.
 * @throws Error with message "SERVER_ERROR" on HTTP 500 or Gemini failure. For
 *   the OpenAI-compatible path, the underlying error message is preserved so
 *   the caller can show the real cause.
 */
export async function callCategorise(
  transactions: RawTransaction[],
  categories: string[] = DEFAULT_CATEGORIES,
  byok?: BYOKConfig | null,
): Promise<CategoriseResponse> {
  const config = byok === undefined ? getBYOKConfig() : byok;

  if (config?.provider === "openai") {
    try {
      const results = await callOpenAIDirect(transactions, categories, config);
      return { results };
    } catch (err) {
      console.error("[callCategorise] OpenAI-compatible error:", err);
      if (err instanceof OpenAIEndpointUnreachableError) {
        // Reason: Endpoints without CORS headers (e.g. campus/self-hosted
        // gateways) can never answer a browser fetch. Relay through
        // /api/categorise — the server has no CORS constraint — carrying the
        // stored credentials so the user doesn't need server env vars.
        return callProxy(transactions, categories, config);
      }
      // Reason: Preserve the underlying message (HTTP status, unparseable
      // output) so the review banner can show why the endpoint failed — a
      // generic SERVER_ERROR leaves the user unable to diagnose it.
      throw err instanceof Error ? err : new Error("SERVER_ERROR");
    }
  }

  if (config) {
    const results = await callGeminiDirect(
      transactions,
      categories,
      config.apiKey,
    );
    return { results };
  }

  return callProxy(transactions, categories);
}

// ---------------------------------------------------------------------------
// Internal: proxy mode
// ---------------------------------------------------------------------------

/**
 * Call /api/categorise server proxy.
 *
 * In dev mode (NEXT_PUBLIC_DEV_TOOLS === 'true'), the proxy returns additional
 * debug data (raw payload + per-transaction reasoning) which is forwarded to
 * the caller as `debug`.
 *
 * @param transactions - Anonymised transactions.
 * @param categories - Category list.
 * @param byok - Optional BYOK credentials relayed to the server (used when a
 *   direct browser call to an OpenAI-compatible endpoint was unreachable).
 * @returns Categorisation results, plus optional debug data in dev mode.
 */
async function callProxy(
  transactions: RawTransaction[],
  categories: string[],
  byok?: BYOKConfig,
): Promise<CategoriseResponse> {
  const body: ProxyRequestBody = {
    transactions: transactions.map((tx, i) => ({
      index: i,
      payee: tx.description,
      notes: tx.notes,
      transactionType: tx.transactionCode,
    })),
    categories,
  };
  if (byok) {
    body.byok = {
      provider: byok.provider,
      apiKey: byok.apiKey,
      baseUrl: byok.baseUrl,
      model: byok.model,
    };
  }

  const res = await fetch("/api/categorise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    const data = (await res.json()) as { retryAfter?: number };
    throw new Error(`RATE_LIMITED:${data.retryAfter ?? 60}`);
  }

  if (!res.ok) {
    throw new Error("SERVER_ERROR");
  }

  const data = (await res.json()) as ProxyResponseBody;
  return { results: data.results, debug: data.debug };
}

// ---------------------------------------------------------------------------
// Internal: BYOK direct mode
// ---------------------------------------------------------------------------

/**
 * Call Gemini API directly from the browser using the user's own API key.
 *
 * Uses a dynamic import to avoid bundling the Gemini SDK into the server
 * bundle and to keep this code path browser-only.
 *
 * @param transactions - Anonymised transactions.
 * @param categories - Category list.
 * @param apiKey - User's Gemini API key.
 * @returns Categorisation results from Gemini.
 */
async function callGeminiDirect(
  transactions: RawTransaction[],
  categories: string[],
  apiKey: string,
): Promise<CategorisationResult[]> {
  // Reason: Dynamic import avoids SSR issues — @google/generative-ai uses
  // fetch internally and is safe in browsers, but we don't want it parsed
  // during server-side rendering.
  const { GoogleGenerativeAI, SchemaType } = await import(
    "@google/generative-ai"
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.0,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            index: { type: SchemaType.INTEGER },
            category: { type: SchemaType.STRING },
          },
          required: ["index", "category"],
        },
      },
    },
  });

  const prompt = buildPrompt(transactions, categories);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as CategorisationResult[];
  } catch (err) {
    console.error("[callGeminiDirect] Gemini error:", err);
    throw new Error("SERVER_ERROR");
  }
}

/**
 * Call an OpenAI-compatible endpoint directly from the browser using the
 * user's own API key (BYOK mode).
 *
 * Uses the shared prompt builder so the categorisation payload is identical
 * to the Gemini path. The endpoint can be OpenAI itself or any compatible
 * provider (custom baseUrl/model from the user's settings).
 *
 * @param transactions - Anonymised transactions.
 * @param categories - Category list.
 * @param config - OpenAI-compatible connection details (key, baseUrl, model).
 * @returns Categorisation results from the endpoint.
 * @throws OpenAIEndpointUnreachableError when fetch never gets a response
 *   (CORS/mixed content/unreachable host) — the caller relays via the proxy.
 */
async function callOpenAIDirect(
  transactions: RawTransaction[],
  categories: string[],
  config: BYOKConfig,
): Promise<CategorisationResult[]> {
  const prompt = buildPrompt(transactions, categories);

  const items = await callOpenAIChat(SYSTEM_INSTRUCTION, prompt, config);
  // Reason: The API contract exposes only { index, category }; any extra
  // fields a provider returns (e.g. reasoning) are dropped here.
  return items.map(({ index, category }) => ({ index, category }));
}
