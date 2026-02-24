# Spec: AI Categorisation

## Name Anonymisation (Privacy)
Personal names in ICT/ITR transactions are replaced before any data leaves the browser:
1. Detect names in `From:`/`To:` fields
2. Map to sequential placeholders: `{ "Person A": "ADAM LEE", "Person B": "NG SOO IM", ... }`
3. Send placeholders to Gemini; restore real names in final CSV output

## API: `POST /api/categorise`

**Request**
```json
{
  "transactions": [
    { "index": 0, "description": "Chicken Rice Kitchen" },
    { "index": 1, "description": "PayNow Transfer to: Person A, notes: san lor horfun" }
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

## Prompt Template
```
You are a financial transaction categorizer for personal expenses in Singapore.
Assign each transaction a category from: [category list].
Transactions:
1. Description A
2. Description B
Respond as a JSON array in input order: [{"index":1,"category":"..."},...]
```

## BYOK Mode
User-supplied Gemini key stored in `localStorage`; calls go directly from browser to Gemini (CORS supported), bypassing the server proxy entirely.
