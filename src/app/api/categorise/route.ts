/**
 * POST /api/categorise — Gemini categorisation proxy.
 *
 * Stateless server-side proxy that forwards anonymised transaction batches
 * to the Gemini API and returns structured category assignments. The server
 * never receives raw PII — anonymisation happens client-side before calling
 * this endpoint.
 *
 * Features:
 * - IP-based rate limiting (default: 10 RPM, configurable via RATE_LIMIT_RPM)
 * - Structured JSON output via Gemini responseSchema
 * - Returns { results: [{ index, category }] } on success
 * - Returns 429 with retryAfter on rate limit
 * - Returns 500 on Gemini SDK failure
 *
 * @see specs/ai-categorisation.md for API contract
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";

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

/** Expected request body shape. */
interface CategorisationRequest {
  transactions: TransactionInput[];
  categories: string[];
}

/** A single categorisation result in the response. */
interface CategorisationResult {
  index: number;
  category: string;
}

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

  // Fast path: return empty results for empty input
  if (body.transactions.length === 0) {
    return Response.json({ results: [] }, { status: 200 });
  }

  // 3. Ensure API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[/api/categorise] GEMINI_API_KEY environment variable is not set");
    return Response.json(
      { error: "Gemini API key is not configured on the server" },
      { status: 500 },
    );
  }

  // 4. Call Gemini with structured output
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
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

    // Build user prompt: send category list + transaction batch as one JSON block
    const userPrompt = JSON.stringify(
      {
        valid_categories: body.categories,
        transactions: body.transactions,
      },
      null,
      2,
    );

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const results = JSON.parse(text) as CategorisationResult[];

    return Response.json({ results }, { status: 200 });
  } catch (err) {
    console.error("[/api/categorise] Gemini API error:", err);
    return Response.json({ error: "Gemini API request failed" }, { status: 500 });
  }
}
