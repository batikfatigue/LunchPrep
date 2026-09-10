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
 * Parse the model's `content` string into categorisation result items.
 *
 * The system instruction tells the model to output a bare JSON array
 * (`[{ "index": number, "category": string }]`). Reason: some compatible
 * providers ignore `response_format` or wrap the array in an object
 * (e.g. `{ "results": [...] }`), so we tolerate both shapes by using the
 * first array-valued property when the top level is an object.
 *
 * @param content - Raw `choices[0].message.content` string.
 * @returns Validated array of result items.
 * @throws Error when the content is not JSON or contains no usable array.
 */
export function parseCategorisationContent(content: string): OpenAIResultItem[] {
  const parsed = JSON.parse(content) as unknown;

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
 * Call an OpenAI-compatible chat completions endpoint for categorisation.
 *
 * Sends the system instruction and user prompt as chat messages with
 * `temperature: 0` (deterministic, matching the Gemini path) and requests
 * `response_format: { type: "json_object" }` — the most widely supported
 * JSON mode across OpenAI-compatible providers. The system instruction
 * already contains the word "JSON", satisfying OpenAI's requirement for
 * that mode.
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
  const baseUrl = (config.baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const model = config.model?.trim() || DEFAULT_OPENAI_MODEL;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed with HTTP ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI response missing choices[0].message.content");
  }

  return parseCategorisationContent(content);
}
