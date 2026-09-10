/**
 * OpenAI-compatible chat completions caller for transaction categorisation.
 *
 * Talks to any endpoint implementing the OpenAI Chat Completions API
 * (`POST {baseUrl}/chat/completions`) — OpenAI itself, Azure OpenAI,
 * OpenRouter, Ollama, LM Studio, vLLM, etc. — using plain `fetch`, so it
 * works identically in the browser (BYOK) and in the server proxy.
 *
 * The module is environment-agnostic: no localStorage, no Gemini SDK.
 * Prompts come from the shared `prompt.ts` builder so provider behaviour
 * stays identical regardless of which AI backend answers.
 *
 * @see specs/ai-categorisation.md for the API contract
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Default base URL for the official OpenAI API. */
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

/** Default model when the caller does not specify one. */
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** Connection details for an OpenAI-compatible endpoint. */
export interface OpenAICompatibleConfig {
  /** API key sent as `Authorization: Bearer <apiKey>`. */
  apiKey: string;
  /**
   * Base URL of the OpenAI-compatible API, e.g. "https://api.openai.com/v1"
   * or "http://localhost:11434/v1" for Ollama. Defaults to
   * DEFAULT_OPENAI_BASE_URL when empty.
   */
  baseUrl?: string;
  /** Model name. Defaults to DEFAULT_OPENAI_MODEL when empty. */
  model?: string;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One categorisation result item as returned inside the model's JSON output. */
export interface OpenAIResultItem {
  index: number;
  category: string;
  /** Present only when the dev-mode system instruction requested reasoning. */
  reasoning?: string;
}

/** Minimal shape of an OpenAI chat completion response that we consume. */
interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

/**
 * Extract the JSON payload from a model's `content` string.
 *
 * Endpoints that ignore `response_format` (older Ollama/vLLM builds,
 * lightweight proxies, weaker local models) frequently wrap the JSON in a
 * markdown code fence or prepend/append prose. This strips a surrounding
 * code fence, then — if the result still isn't valid JSON — slices from the
 * first `[`/`{` to the last `]`/`}` so the JSON is recovered.
 *
 * @param content - Raw `choices[0].message.content` string.
 * @returns The best-effort JSON substring (the original text when no JSON
 *   boundary can be located, so `JSON.parse` throws its usual error).
 */
export function extractJsonPayload(content: string): string {
  let candidate = content.trim();

  // Strip a single surrounding markdown fence, e.g. ```json\n...\n```.
  const fence = candidate.match(/^```[a-zA-Z]*\s*\n?([\s\S]*?)```\s*$/);
  if (fence?.[1] !== undefined) candidate = fence[1].trim();

  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    // Fall through to boundary extraction.
  }

  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
  if (start === -1 || end <= start) return candidate;
  return candidate.slice(start, end + 1);
}

/**
 * Normalise a provider-supplied `message.content` value to a string.
 *
 * Most endpoints return a plain string, but some (e.g. OpenRouter multi-part
 * responses) return an array of typed parts like `[{ type: "text", text }]` —
 * those are joined into a single string.
 *
 * @param content - Raw `choices[0].message.content` value.
 * @returns The content as a string, or null when no text is present.
 */
function extractMessageContent(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .map((part) =>
        part !== null && typeof part === "object"
          ? ((part as { text?: unknown }).text ?? "")
          : "",
      )
      .filter((t): t is string => typeof t === "string")
      .join("");
    return text.length > 0 ? text : null;
  }
  return null;
}

/**
 * Parse the model's `content` string into categorisation result items.
 *
 * The system instruction tells the model to output a bare JSON array
 * (`[{ "index": number, "category": string }]`). Reason: some compatible
 * providers ignore `response_format` or wrap the array in an object
 * (e.g. `{ "results": [...] }`), so we tolerate both shapes by using the
 * first array-valued property when the top level is an object. Markdown
 * fences and surrounding prose are stripped via extractJsonPayload().
 *
 * @param content - Raw `choices[0].message.content` string.
 * @returns Validated array of result items.
 * @throws Error when the content is not JSON or contains no usable array.
 */
export function parseCategorisationContent(content: string): OpenAIResultItem[] {
  const parsed = JSON.parse(extractJsonPayload(content)) as unknown;

  let items: unknown;
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed !== null && typeof parsed === "object") {
    // Tolerate object-wrapped output: pick the first array-valued property.
    items = Object.values(parsed).find((v) => Array.isArray(v));
  }

  if (!Array.isArray(items)) {
    throw new Error("OpenAI response did not contain a results array");
  }

  return (items as unknown[]).map((item) => {
    const obj = item as Record<string, unknown>;
    if (typeof obj.index !== "number" || typeof obj.category !== "string") {
      throw new Error("OpenAI response item missing index/category");
    }
    return {
      index: obj.index,
      category: obj.category,
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

/**
 * Normalise a user-supplied base URL for the chat completions call.
 *
 * Trims whitespace and trailing slashes, and drops a `/chat/completions`
 * suffix — users frequently paste the full endpoint URL into the base URL
 * field, which would otherwise produce `…/chat/completions/chat/completions`
 * and fail with HTTP 404.
 *
 * @param baseUrl - Raw base URL setting (may be empty).
 * @returns Base URL ready for `/chat/completions` to be appended.
 */
function normaliseBaseUrl(baseUrl: string | undefined): string {
  return (baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL)
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/i, "");
}

/**
 * POST a chat completions request, converting network-level failures
 * (unreachable host, CORS rejection, mixed-content block) into an Error
 * that names the URL that was tried.
 *
 * @param url - Full endpoint URL.
 * @param apiKey - Bearer token for the Authorization header.
 * @param body - Request body (serialised as JSON).
 * @returns The raw fetch Response.
 * @throws Error when the request never produces an HTTP response.
 */
async function postChatCompletions(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Could not reach ${url} — check the base URL is correct and that ` +
        `the endpoint allows requests from this page (CORS / mixed content). ` +
        `(${err instanceof Error ? err.message : String(err)})`,
    );
  }
}

/**
 * Call an OpenAI-compatible chat completions endpoint for categorisation.
 *
 * Sends the system instruction and user prompt as chat messages with
 * `temperature: 0` (deterministic, matching the Gemini path) and requests
 * `response_format: { type: "json_object" }` — the most widely supported
 * JSON mode across OpenAI-compatible providers. The system instruction
 * already contains the word "JSON", satisfying OpenAI's requirement for
 * that mode. On HTTP 400 the request is retried once without
 * `response_format`, since some compatible endpoints reject the parameter
 * outright.
 *
 * @param systemInstruction - SYSTEM_INSTRUCTION or DEV_SYSTEM_INSTRUCTION.
 * @param userPrompt - Stringified JSON payload built by buildPrompt() (or the
 *   equivalent server-side payload of { valid_categories, transactions }).
 * @param config - Endpoint, key, and model selection.
 * @returns Parsed result items (with `reasoning` when dev mode requested it).
 * @throws Error on HTTP failure, unexpected response shape, or bad JSON.
 */
export async function callOpenAIChat(
  systemInstruction: string,
  userPrompt: string,
  config: OpenAICompatibleConfig,
): Promise<OpenAIResultItem[]> {
  const baseUrl = normaliseBaseUrl(config.baseUrl);
  const url = `${baseUrl}/chat/completions`;
  const model = config.model?.trim() || DEFAULT_OPENAI_MODEL;

  const body: Record<string, unknown> = {
    model,
    temperature: 0,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  };

  let res = await postChatCompletions(url, config.apiKey, body);

  if (!res.ok && res.status === 400) {
    // Reason: Some OpenAI-compatible endpoints reject `response_format`
    // entirely. The system instruction already demands strict JSON and the
    // parser tolerates free-form output, so retry once without it.
    const bodyWithoutFormat = { ...body };
    delete bodyWithoutFormat.response_format;
    res = await postChatCompletions(url, config.apiKey, bodyWithoutFormat);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed with HTTP ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = extractMessageContent(data.choices?.[0]?.message?.content);
  if (content === null) {
    throw new Error("OpenAI response missing choices[0].message.content");
  }

  return parseCategorisationContent(content);
}
