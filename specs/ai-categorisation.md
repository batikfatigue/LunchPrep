# Spec: AI Categorisation

The categorisation backend is provider-agnostic. Two providers are supported, selected via the `AI_PROVIDER` environment variable (server proxy) or the BYOK provider picker (client):

- **Gemini** (default) — `gemini-2.5-flash-lite` via `@google/generative-ai`, structured `responseSchema` output.
- **OpenAI-compatible** — any endpoint implementing `POST {baseUrl}/chat/completions` (OpenAI, Azure OpenAI, OpenRouter, Ollama, LM Studio, vLLM, …). Plain `fetch` is used — no vendor SDK. Requests use `temperature: 0`, the same system instruction and JSON user payload as Gemini, and `response_format: { type: "json_object" }`. Responses are parsed tolerantly: the result array may be bare or wrapped in an object property.

## Name Anonymisation (Privacy)
Personal names are replaced with mock data before leaving the browser, while **merchant names are preserved** so the AI can categorise accurately.
1. **Gate by Transaction Code**: Only apply anonymisation to transfer codes (`ICT`, `ITR`). Card/NETS purchases (`POS`, `MST`, `UMC`) are always merchants and bypass this step entirely.
2. **Business Name Exclusion**: Even for transfers (e.g., PayNow), skip anonymisation if the payee string contains standard business keywords (e.g., `PTE LTD`, `LTD`, `ENTERPRISE`, `CAFE`).
3. **User-Curated Whitelist (Learning)**: The review table allows users to flag incorrectly anonymised merchants (e.g. a hawker stall named "ECLIPSE" or "NG SOO IM"). These flagged names are saved to a whitelist in `localStorage`. The crawler checks this whitelist before anonymising.
4. Map remaining detected names to realistic mock names (e.g., "John Tan"): `{ "ALICE WONG": "Jane Doe", ... }`. This preserves the AI's ability to infer context (e.g., "Jane Doe" implies a peer-to-peer transfer).
5. Send mock names to the AI provider; restore real names in final CSV output

## API: `POST /api/categorise`

**Request**
```json
{
  "transactions": [
    { "index": 0, "payee": "Noodle House Stall", "notes": "", "transactionType": "Point of Sale" },
    { "index": 1, "payee": "John Tan", "notes": "san lor horfun", "transactionType": "Inward Transfer" }
  ],
  "categories": ["Groceries", "Dining", "Transport", "Shopping", "Entertainment",
                  "Utilities", "Healthcare", "Education", "Personal", "Transfers", "Income", "Other"]
}
```

**Response (200)**
```json
{ "results": [{ "index": 0, "category": "Dining" }, { "index": 1, "category": "Dining" }] }
```

**Errors**
- `429` — rate limit hit; body includes `retryAfter` seconds
- `500` — AI provider failure; user falls back to manual categorisation

## Provider Configuration (server proxy)
| Setting | Value |
|---|---|
| `AI_PROVIDER` | `gemini` (default) or `openai` |
| `OPENAI_API_KEY` | Required when `AI_PROVIDER=openai` |
| `OPENAI_BASE_URL` | Optional, defaults to `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o-mini` |

## Provider Config
| Setting | Value |
|---|---|
| Model | `gemini-2.5-flash-lite` (Gemini) or `gpt-4o-mini` (OpenAI-compatible default) |
| Temperature | `0.0` (deterministic) |
| Response format | Gemini: structured `responseSchema`; OpenAI-compatible: `json_object` mode with tolerant parsing |
| Batching | All transactions in one prompt (minimize API calls) |

## Implementation Details
The same system instruction and user payload are used for every provider. For Gemini, the SDK's `systemInstruction` feature is used; for OpenAI-compatible endpoints it is sent as the `system` chat message.

**System Instruction:**
```text
You are an expert financial categoriser for personal expenses in Singapore. 
Your job is to assign each transaction exactly one category from the user's provided list.

Rules:
1. Pay attention to the "transactionType" to understand if it's a purchase, transfer, or fee.
2. Consider "notes" which might contain user-provided context or FAST purpose codes.
3. If it looks like a person-to-person transfer (e.g., PayNow to a generic name) and no context is provided, default to "Transfers".
4. Output strict JSON only.
```

**User Prompt:**
Send the current category list and the batch of transactions as a stringified JSON block:
```json
{
  "valid_categories": ["Dining", "Groceries", "Transfers"],
  "transactions": [
    { "index": 0, "payee": "Noodle House Stall", "notes": "", "transactionType": "Point of Sale" },
    { "index": 1, "payee": "John Tan", "notes": "san lor horfun", "transactionType": "Inward Transfer" }
  ]
}
```

**Expected JSON Schema Output:**
The model must be constrained to output a JSON array of objects: `[{ "index": number, "category": string }]`

## BYOK Mode
User-supplied credentials are stored in `localStorage`; calls go directly from the browser to the provider, bypassing the server proxy entirely.

| localStorage key | Purpose |
|---|---|
| `lunchprep_ai_provider` | `"gemini"` (default) or `"openai"` |
| `lunchprep_gemini_key` | Gemini API key |
| `lunchprep_openai_key` | OpenAI-compatible API key |
| `lunchprep_openai_base_url` | Optional endpoint override |
| `lunchprep_openai_model` | Optional model override |
