/**
 * Client-side categorisation entry point.
 *
 * Routes categorisation calls to either:
 * - The /api/categorise server proxy (default, uses server-side Gemini key)
 * - Gemini API directly from the browser (BYOK mode, user's own key)
 *
 * This module runs in the browser only. Do not import it in server-side code.
 *
 * @see specs/ai-categorisation.md for BYOK mode description
 */

import { buildPrompt, SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import type { RawTransaction } from "@/lib/parsers/types";

/** localStorage key for the user's personal Gemini API key (BYOK mode). */
const BYOK_STORAGE_KEY = "lunchprep_gemini_key";

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

/** Shape of the request body sent to /api/categorise. */
interface ProxyRequestBody {
  transactions: Array<{
    index: number;
    payee: string;
    notes: string;
    transactionType: string;
  }>;
  categories: string[];
}

// ---------------------------------------------------------------------------
// BYOK helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve the user's BYOK Gemini API key from localStorage.
 *
 * Returns null in non-browser environments or when no key is stored.
 *
 * @returns API key string, or null if not set.
 */
export function getBYOKKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BYOK_STORAGE_KEY);
}

/**
 * Store a BYOK Gemini API key in localStorage.
 *
 * @param key - Gemini API key to store. Pass null to clear.
 */
export function setBYOKKey(key: string | null): void {
  if (typeof window === "undefined") return;
  if (key === null) {
    window.localStorage.removeItem(BYOK_STORAGE_KEY);
  } else {
    window.localStorage.setItem(BYOK_STORAGE_KEY, key);
  }
}

// ---------------------------------------------------------------------------
// Categorisation
// ---------------------------------------------------------------------------

/**
 * Send anonymised transactions to the categorisation service.
 *
 * Routing logic:
 * - If a BYOK key is available in localStorage (or passed explicitly):
 *   calls Gemini directly from the browser, bypassing the server proxy.
 * - Otherwise: calls the /api/categorise server proxy.
 *
 * Throws on API failure to allow the caller to show an error state.
 *
 * @param transactions - Anonymised RawTransaction[] (PII must be masked first).
 * @param categories - Category list. Defaults to DEFAULT_CATEGORIES.
 * @param byokKey - Explicit API key override (useful for testing). If omitted,
 *   reads from localStorage via getBYOKKey().
 * @returns Array of { index, category } results.
 * @throws Error with message "RATE_LIMITED:<retryAfter>" on HTTP 429.
 * @throws Error with message "SERVER_ERROR" on HTTP 500 or Gemini SDK failure.
 */
export async function callCategorise(
  transactions: RawTransaction[],
  categories: string[] = DEFAULT_CATEGORIES,
  byokKey?: string,
): Promise<CategorisationResult[]> {
  const key = byokKey ?? getBYOKKey();

  if (key) {
    return callGeminoDirect(transactions, categories, key);
  }
  return callProxy(transactions, categories);
}

// ---------------------------------------------------------------------------
// Internal: proxy mode
// ---------------------------------------------------------------------------

/**
 * Call /api/categorise server proxy.
 *
 * @param transactions - Anonymised transactions.
 * @param categories - Category list.
 * @returns Categorisation results from the proxy.
 */
async function callProxy(
  transactions: RawTransaction[],
  categories: string[],
): Promise<CategorisationResult[]> {
  const body: ProxyRequestBody = {
    transactions: transactions.map((tx, i) => ({
      index: i,
      payee: tx.description,
      notes: tx.notes,
      transactionType: tx.transactionCode,
    })),
    categories,
  };

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

  const data = (await res.json()) as { results: CategorisationResult[] };
  return data.results;
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
async function callGeminoDirect(
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
    console.error("[callGeminoDirect] Gemini error:", err);
    throw new Error("SERVER_ERROR");
  }
}
