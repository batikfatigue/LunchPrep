# Spec: AI Categorisation

## Name Anonymisation (Privacy)
Personal names are replaced with mock data before leaving the browser, while **merchant names are preserved** so Gemini can categorise accurately.
1. **Gate by Transaction Code**: Only apply anonymisation to transfer codes (`ICT`, `ITR`). Card/NETS purchases (`POS`, `MST`, `UMC`) are always merchants and bypass this step entirely.
2. **Business Name Exclusion**: Even for transfers (e.g., PayNow), skip anonymisation if the payee string contains standard business keywords (e.g., `PTE LTD`, `LTD`, `ENTERPRISE`, `CAFE`).
3. **User-Curated Whitelist (Learning)**: The review table allows users to flag incorrectly anonymised merchants (e.g. a hawker stall named "ECLIPSE" or "NG SOO IM"). These flagged names are saved to a whitelist in `localStorage`. The crawler checks this whitelist before anonymising.
4. Map remaining detected names to realistic mock names (e.g., "John Tan"): `{ "ALICE WONG": "Jane Doe", ... }`. This preserves the AI's ability to infer context (e.g., "Jane Doe" implies a peer-to-peer transfer).
5. Send mock names to Gemini; restore real names in final CSV output

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
- `500` — Gemini failure; user falls back to manual categorisation

## Gemini Config
| Setting | Value |
|---|---|
| Model | `gemini-2.5-flash-lite` |
| Temperature | `0.0` (deterministic) |
| Response format | Structured JSON with category enum |
| Batching | All transactions in one prompt (minimize API calls) |

## Gemini Implementation Details
To maximize Gemini 2.5 Flash-Lite's reliability, use the SDK's `systemInstruction` feature and pass data as structured JSON.

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
User-supplied Gemini key stored in `localStorage`; calls go directly from browser to Gemini (CORS supported), bypassing the server proxy entirely.
