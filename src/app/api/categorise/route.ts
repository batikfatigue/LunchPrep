/**
 * POST /api/categorise — AI categorisation proxy.
 *
 * Stateless server-side proxy that forwards anonymised transaction batches
 * to the configured AI provider and returns structured category assignments.
 * The server never receives raw PII — anonymisation happens client-side
 * before calling this endpoint.
 *
 * Providers (selected via the AI_PROVIDER env var):
 * - "gemini" (default) — Google Gemini via @google/generative-ai
 * - "openai" — any OpenAI-compatible chat completions endpoint
 *
 * Features:
 * - IP-based rate limiting (default: 10 RPM, configurable via RATE_LIMIT_RPM)
 * - Optional `byok` body field: per-request provider credentials relayed by
 *   the client when a provider endpoint can't be reached from the browser
 *   (e.g. no CORS headers); overrides the server env configuration
 * - Structured JSON output (Gemini responseSchema / OpenAI json_object mode)
 * - Returns { results: [{ index, category }] } on success
 * - Returns 429 with retryAfter on rate limit
 * - Returns 500 on provider failure
 *
 * @see specs/ai-categorisation.md for API contract
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ObjectSchema } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION, DEV_SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";
import { callOpenAIChat } from "@/lib/categoriser/openai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single transaction item received in the request body. */
interface TransactionInput {
  index: number;
  payee: string;
  notes: string;
  transactionType: string;
}

/**
 * Per-request BYOK credentials relayed by the client when the provider
 * endpoint could not be reached directly from the browser (e.g. it lacks
 * CORS headers). Overrides the server-side env configuration.
 */
interface ByokRelay {
  provider: "gemini" | "openai";
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/** Expected request body shape. */
interface CategorisationRequest {
  transactions: TransactionInput[];
  categories: string[];
  byok?: ByokRelay;
}

/** A single categorisation result in the response. */
interface CategorisationResult {
  index: number;
  category: string;
}

/**
 * Result item with optional reasoning, as returned by a provider when the
 * dev-mode system instruction requests it. The `reasoning` field is
 * stripped before sending back the public results array.
 */
interface MaybeReasonedResult {
  index: number;
  category: string;
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Dev-mode flag (evaluated at build time by Next.js bundler — dead code
// elimination removes the dev branch entirely in production builds)
// ---------------------------------------------------------------------------

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_TOOLS === "true";

// ---------------------------------------------------------------------------
// Rate limiter (in-memory, per-process singleton)
// ---------------------------------------------------------------------------

/** Per-IP sliding window state. */
interface RateWindow {
  count: number;
  resetAt: number; // Unix timestamp (ms) when the window resets
}

// Reason: Module-level Map persists across requests within the same Node.js
// process. In serverless deployments, it resets on cold starts — acceptable
// for MVP rate limiting without a Redis dependency.
const ipWindows = new Map<string, RateWindow>();
const RPM_LIMIT = parseInt(process.env.RATE_LIMIT_RPM ?? "10", 10);

/**
 * Check whether the given IP address is within its per-minute request quota.
 *
 * @param ip - Client IP address string.
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfter: number }`.
 */
function checkRateLimit(ip: string): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const window = ipWindows.get(ip);

  // Start a fresh window if none exists or the previous one has expired
  if (!window || now > window.resetAt) {
    ipWindows.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }

  if (window.count >= RPM_LIMIT) {
    const retryAfter = Math.ceil((window.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  window.count++;
  return { allowed: true };
}

/**
 * Extract the client's IP address from request headers.
 *
 * Prefers x-forwarded-for (set by Vercel/proxies), falls back to x-real-ip,
 * then "unknown" for local development.
 *
 * @param req - Incoming Next.js App Router request.
 * @returns IP address string.
 */
function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * Handle POST /api/categorise.
 *
 * Validates the request, applies rate limiting, calls Gemini with a structured
 * JSON schema, and returns `{ results: [{ index, category }] }`.
 *
 * @param req - Next.js App Router Request object.
 * @returns JSON Response.
 */
export async function POST(req: Request): Promise<Response> {
  // 1. Rate limit check
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfter: rateCheck.retryAfter },
      { status: 429 },
    );
  }

  // 2. Parse and validate request body
  let body: CategorisationRequest;
  try {
    body = (await req.json()) as CategorisationRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body?.transactions) || !Array.isArray(body?.categories)) {
    return Response.json(
      { error: "Request must include 'transactions' and 'categories' arrays" },
      { status: 400 },
    );
  }

  // Validate the optional BYOK relay: provider must be recognised and carry a
  // non-empty key. Only apply it when every required field is present.
  let byok: ByokRelay | null = null;
  if (body.byok !== undefined) {
    const b = body.byok;
    const validProvider = b?.provider === "gemini" || b?.provider === "openai";
    if (!validProvider || typeof b.apiKey !== "string" || !b.apiKey.trim()) {
      return Response.json(
        { error: "Invalid 'byok' relay: expected { provider, apiKey }" },
        { status: 400 },
      );
    }
    byok = {
      provider: b.provider,
      apiKey: b.apiKey,
      baseUrl: typeof b.baseUrl === "string" ? b.baseUrl : undefined,
      model: typeof b.model === "string" ? b.model : undefined,
    };
  }

  // Fast path: return empty results for empty input
  if (body.transactions.length === 0) {
    return Response.json({ results: [] }, { status: 200 });
  }

  // 3. Select the AI provider. A relayed BYOK config wins over the server
  // env (AI_PROVIDER defaults to Gemini for backwards compatibility).
  const provider = (
    byok?.provider ??
    process.env.AI_PROVIDER ??
    "gemini"
  ).toLowerCase();

  // Build user prompt: send category list + transaction batch as one JSON block.
  // Identical for every provider — each adapter wraps it in its own wire format.
  const userPrompt = JSON.stringify(
    {
      valid_categories: body.categories,
      transactions: body.transactions,
    },
    null,
    2,
  );

  const systemInstruction = IS_DEV_MODE
    ? DEV_SYSTEM_INSTRUCTION
    : SYSTEM_INSTRUCTION;

  // 4. Call the selected provider
  try {
    // Provider result items may carry a `reasoning` field in dev mode.
    let rawResults: MaybeReasonedResult[];

    if (provider === "openai") {
      const apiKey = byok?.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error("[/api/categorise] OPENAI_API_KEY environment variable is not set");
        return Response.json(
          { error: "OpenAI API key is not configured on the server" },
          { status: 500 },
        );
      }
      rawResults = await callOpenAIChat(systemInstruction, userPrompt, {
        apiKey,
        baseUrl: byok?.baseUrl ?? process.env.OPENAI_BASE_URL,
        model: byok?.model ?? process.env.OPENAI_MODEL,
      });
    } else if (provider === "gemini") {
      const apiKey = byok?.apiKey ?? process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[/api/categorise] GEMINI_API_KEY environment variable is not set");
        return Response.json(
          { error: "Gemini API key is not configured on the server" },
          { status: 500 },
        );
      }
      rawResults = await callGemini(apiKey, userPrompt);
    } else {
      console.error(`[/api/categorise] Unsupported AI_PROVIDER: ${provider}`);
      return Response.json(
        { error: `Unsupported AI_PROVIDER "${provider}" (expected "gemini" or "openai")` },
        { status: 500 },
      );
    }

    if (IS_DEV_MODE) {
      const results: CategorisationResult[] = rawResults.map(({ index, category }) => ({
        index,
        category,
      }));
      return Response.json(
        {
          results,
          debug: {
            rawPayload: userPrompt,
            perTransaction: rawResults.map(({ index, reasoning }) => ({
              index,
              reasoning: reasoning ?? "",
            })),
          },
        },
        { status: 200 },
      );
    }

    const results: CategorisationResult[] = rawResults.map(({ index, category }) => ({
      index,
      category,
    }));
    return Response.json({ results }, { status: 200 });
  } catch (err) {
    console.error(`[/api/categorise] ${provider} API error:`, err);
    return Response.json(
      { error: "AI provider request failed" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Internal: Gemini provider
// ---------------------------------------------------------------------------

/**
 * Call Gemini with a structured JSON schema for categorisation.
 *
 * @param apiKey - Server-side Gemini API key (GEMINI_API_KEY).
 * @param userPrompt - Stringified { valid_categories, transactions } payload.
 * @returns Parsed result items; `reasoning` is present when dev mode is on.
 */
async function callGemini(
  apiKey: string,
  userPrompt: string,
): Promise<MaybeReasonedResult[]> {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Reason: In dev mode, the schema is extended with a `reasoning` field so
  // Gemini explains each categorisation decision. This field is never added
  // in production to avoid extra cost and latency.
  const prodResultSchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      index: { type: SchemaType.INTEGER },
      category: { type: SchemaType.STRING },
    },
    required: ["index", "category"],
  };

  const devResultSchema: ObjectSchema = {
    type: SchemaType.OBJECT,
    properties: {
      index: { type: SchemaType.INTEGER },
      category: { type: SchemaType.STRING },
      reasoning: { type: SchemaType.STRING },
    },
    required: ["index", "category", "reasoning"],
  };

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    systemInstruction: IS_DEV_MODE ? DEV_SYSTEM_INSTRUCTION : SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.0,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: IS_DEV_MODE ? devResultSchema : prodResultSchema,
      },
    },
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  return JSON.parse(text) as MaybeReasonedResult[];
}
