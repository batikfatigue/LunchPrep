name: "Phase 2: AI Integration — Categorisation, Anonymisation & Proxy"
description: |

## Purpose
Full implementation plan for Phase 2 of LunchPrep. Provides complete context, type
contracts, pseudocode, and executable validation gates so the agent can build and
validate in one pass without gaps.

## Core Principles
1. **Context is King**: All interfaces, data shapes, and edge cases are documented here.
2. **Validation Loops**: Every gate is a runnable command; run and fix before moving on.
3. **Progressive Success**: Build and test each module before wiring them together.
4. **Global rules**: Follow all rules in CLAUDE.md (strict TypeScript, JSDoc, 500-line limit, tests).

---

## Goal

Implement Phase 2 of LunchPrep — AI-powered transaction categorisation with privacy
preservation. The pipeline extension is:

```
[Existing] Parse CSV → RawTransaction[]
     ↓ NEW: anonymise() — mask personal names in transfer transactions
     ↓ NEW: callCategorise() — batch call to Gemini (proxy or BYOK direct)
     ↓ NEW: restore PII — swap mock names back to originals
     ↓ NEW: export with categories — write category column in Lunch Money CSV
```

The four deliverables are:
1. **Name Anonymiser** (`src/lib/anonymiser/pii.ts`) — masks personal names in ICT/ITR
   transactions before any data leaves the browser, restores them afterward.
2. **Gemini Proxy** (`src/app/api/categorise/route.ts`) — stateless `POST /api/categorise`
   proxying to `gemini-2.5-flash-lite` with IP-based rate limiting (10 RPM).
3. **UI: Transaction Table** (`src/components/transaction-table.tsx`) — review table with
   category dropdown, loading overlay, and error-fallback state.
4. **Tests** — Vitest unit tests for the anonymiser and prompt builder.

---

## Why

- Users need categories on every transaction row for Lunch Money's import to be useful.
- Personal names (PayNow recipients) must never reach external APIs — anonymise first.
- A server proxy avoids CORS problems and hides the default API key from the client.
- BYOK mode lets power users supply their own Gemini key, routing calls from the browser.

---

## What

### User-visible behaviour
- After parsing, all transactions are sent to Gemini in one batched request.
- Gemini returns `[{ index, category }]`; categories appear as a dropdown in the table.
- Users can override any category from the dropdown before exporting.
- If the API call fails (429 / 500), an alert appears and every row's dropdown is editable.
- The exported Lunch Money CSV has the `category` column populated.

### Technical requirements
- All CSV/PII processing is client-side only. The server never sees raw data.
- Transfer transactions (ICT, ITR) are anonymised; merchant transactions (POS, MST, UMC) are not.
- Gemini is called with temperature 0.0 and a structured JSON schema to guarantee output shape.
- Rate limit: 10 RPM per IP (configurable via `RATE_LIMIT_RPM` env var).
- On 429 the response body includes `retryAfter` seconds.

---

## Success Criteria

- [ ] `anonymise()` masks personal names in ICT/ITR; skips POS/MST/UMC.
- [ ] `anonymise()` skips business-entity payees (contains `PTE LTD`, `LTD`, etc.).
- [ ] `restore()` replaces every mock name back to the original before export.
- [ ] `POST /api/categorise` returns `{ results: [{ index, category }] }` on success.
- [ ] `POST /api/categorise` returns `429` with `retryAfter` when over 10 RPM.
- [ ] `POST /api/categorise` returns `500` on Gemini SDK error.
- [ ] Transaction table renders all rows; category dropdown pre-populated from API results.
- [ ] Loading overlay shown while API call is in-flight; hidden on completion or error.
- [ ] Exported CSV has category column filled; category is empty string if not set.
- [ ] All new Vitest tests pass: `npm test`.
- [ ] TypeScript compiles: `npx tsc --noEmit`.

---

## All Needed Context

### Documentation & References
```yaml
- url: https://ai.google.dev/gemini-api/docs/structured-output
  why: >
    How to use responseMimeType + responseSchema in @google/generative-ai SDK.
    See "Generate JSON using a schema" section. Use SchemaType enum for type fields.

- url: https://ai.google.dev/gemini-api/docs/models
  why: Confirm the model ID. The spec requires "gemini-2.5-flash-lite".

- url: https://www.npmjs.com/package/@google/generative-ai
  why: Package name, install command, and import paths.

- file: src/lib/parsers/types.ts
  why: >
    RawTransaction and BankParser interfaces. The anonymiser reads and writes:
    - description (string): will be replaced with mock name for ICT/ITR
    - transactionCode (string): gate check — "FAST or PayNow Payment / Receipt" (ICT)
      or "Funds Transfer" (ITR)
    - originalPII (Record<string,string>): maps { mockName: originalName } per transaction

- file: src/lib/parsers/dbs.ts
  why: >
    Shows how RawTransaction is built (line 425–433). transactionCode is the FULL
    DESCRIPTION from dbs_codes.json, not the short code. ICT → "FAST or PayNow
    Payment / Receipt", ITR → "Funds Transfer".

- file: src/lib/exporter/lunchmoney.ts
  why: >
    Pattern for pure helper functions + JSDoc. generateLunchMoneyCsv must be updated to
    accept an optional second parameter: categoriesMap?: ReadonlyMap<number, string>.
    Category column currently hardcoded to "".

- file: tests/exporter/lunchmoney.test.ts
  why: >
    Gold-standard test patterns: makeTx() helper, describe/it structure, vi.spyOn mocks.
    Mirror these patterns in new test files.

- file: src/components/ui/button.tsx
  why: >
    Radix UI v1 import pattern: `import { Select } from "radix-ui"` gives
    Select.Root, Select.Trigger, Select.Value, Select.Content, Select.Item, etc.
    Use same Tailwind + cn() utility approach for styling.

- file: src/lib/utils.ts
  why: cn() utility for class merging. Import with `import { cn } from "@/lib/utils"`.

- file: specs/ai-categorisation.md
  why: >
    Canonical spec: request/response JSON shape, Gemini config, system instruction text,
    anonymisation gating rules, BYOK mode description.

- file: docs/todo.md
  why: Phase 2 checklist. Mark tasks complete as they are implemented.
```

### Current codebase tree
```
src/
├── app/
│   ├── page.tsx                     # Placeholder "Coming soon" page — update in Task 8
│   └── api/                         # (empty — create categorise/route.ts here)
├── lib/
│   ├── parsers/
│   │   ├── types.ts                 # RawTransaction, BankParser interfaces
│   │   ├── dbs.ts                   # DBS parser
│   │   ├── registry.ts              # detectAndParse()
│   │   └── data/
│   │       ├── dbs_codes.json       # "ICT" → "FAST or PayNow Payment / Receipt"
│   │       └── fast_purpose_codes.json
│   ├── exporter/
│   │   └── lunchmoney.ts            # generateLunchMoneyCsv, downloadCsv
│   ├── categoriser/                 # (EMPTY — create these)
│   └── anonymiser/                  # (EMPTY — create these)
├── components/
│   └── ui/
│       └── button.tsx               # Radix UI + CVA pattern to follow
tests/
├── parsers/dbs.test.ts
├── exporter/lunchmoney.test.ts
└── setup.test.ts
```

### Desired codebase tree after Phase 2
```
src/
├── app/
│   ├── page.tsx                     # [MODIFIED] Wire up file upload + table + export
│   └── api/
│       └── categorise/
│           └── route.ts             # [NEW] POST /api/categorise — Gemini proxy
├── lib/
│   ├── anonymiser/
│   │   └── pii.ts                   # [NEW] anonymise(), restore(), isBusinessName()
│   ├── categoriser/
│   │   ├── categories.ts            # [NEW] DEFAULT_CATEGORIES, loadCategories()
│   │   ├── prompt.ts                # [NEW] buildPrompt(), SYSTEM_INSTRUCTION
│   │   └── client.ts               # [NEW] callCategorise() — proxy or BYOK routing
│   └── exporter/
│       └── lunchmoney.ts            # [MODIFIED] accept categoriesMap param
├── components/
│   └── transaction-table.tsx        # [NEW] Review table with category dropdown
tests/
├── anonymiser/
│   └── pii.test.ts                  # [NEW] Anonymiser unit tests
├── categoriser/
│   └── prompt.test.ts               # [NEW] Prompt builder unit tests
├── exporter/
│   └── lunchmoney.test.ts           # [MODIFIED] Add category-param tests
```

### Known Gotchas & Critical Details

```typescript
// CRITICAL: transactionCode stores the FULL DESCRIPTION, not the short code.
// ICT → "FAST or PayNow Payment / Receipt"
// ITR → "Funds Transfer"
// POS → "Point-of-Sale Transaction or Proceeds"
// MST/UMC → "Debit Card Transaction"
// The anonymiser must gate on THESE strings, not "ICT"/"ITR".

// CRITICAL: originalPII direction is { mockName: originalName }
// To anonymise:  tx.originalPII = { "James Tan": "Alice Wong" }
//                tx.description = "James Tan"
// To restore:    tx.description = tx.originalPII[tx.description] ?? tx.description

// CRITICAL: Transactions must be treated as immutable values.
// Always return NEW objects (spread { ...tx, ... }) rather than mutating in place.

// CRITICAL: @google/generative-ai must be added as a dependency before writing route.ts
// npm install @google/generative-ai

// CRITICAL: Next.js App Router API routes use Web Request/Response, not Node IncomingMessage.
// Get IP: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"

// CRITICAL: In-memory rate limiter resets on process restart; that is acceptable for MVP.
// Use a module-level Map — it persists across requests in the same process.

// CRITICAL: Gemini responseSchema uses SchemaType enum from @google/generative-ai.
// import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// CRITICAL: The API route must NOT include BYOK logic — the server never handles user keys.
// BYOK routing is done entirely in src/lib/categoriser/client.ts (client-side).

// CRITICAL: loadCategories() reads localStorage only on the CLIENT.
// In SSR/test contexts localStorage is undefined — guard with typeof window !== "undefined".

// CRITICAL: radix-ui v1 (unified package) imports are namespaced:
// import { Select } from "radix-ui";   →  <Select.Root>, <Select.Trigger>, etc.
// Do NOT use "@radix-ui/react-select" — that's the old individual package.

// CRITICAL: Vitest runs with happy-dom environment; localStorage IS available in tests.
// Mock it with vi.stubGlobal("localStorage", { getItem: vi.fn(), setItem: vi.fn() }).
```

---

## Data Models & Type Contracts

### Existing: RawTransaction (do NOT modify)
```typescript
// src/lib/parsers/types.ts
interface RawTransaction {
  date: Date;
  description: string;          // Will be set to mockName during anonymisation
  originalDescription: string;  // Raw CSV value — never modified
  amount: number;
  transactionCode: string;      // Full description from dbs_codes.json
  notes: string;
  originalPII: Record<string, string>; // { mockName: originalName } — populated by anonymiser
}
```

### New: CategorisationRequest / CategorisationResponse (for API route)
```typescript
// Inlined in route.ts (no separate file needed — small enough)
interface TransactionInput {
  index: number;
  payee: string;
  notes: string;
  transactionType: string; // = tx.transactionCode (full description)
}

interface CategorisationRequest {
  transactions: TransactionInput[];
  categories: string[];
}

interface CategorisationResult {
  index: number;
  category: string;
}

interface CategorisationResponse {
  results: CategorisationResult[];
}
```

---

## Implementation Blueprint

### Task 1: Install Gemini SDK dependency

```yaml
SHELL:
  - run: npm install @google/generative-ai
  - verify: package.json now has "@google/generative-ai" in dependencies
```

---

### Task 2: Create `src/lib/categoriser/categories.ts`

Simple module. No external dependencies.

```typescript
// Pseudocode
export const DEFAULT_CATEGORIES: string[] = [
  "Dining", "Groceries", "Transport", "Shopping", "Entertainment",
  "Utilities", "Healthcare", "Education", "Personal",
  "Transfers", "Income", "Other"
];

/**
 * Load categories from localStorage if available, else return defaults.
 * Guards against SSR / non-browser environments.
 */
export function loadCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  const stored = window.localStorage.getItem("lunchprep_categories");
  if (!stored) return DEFAULT_CATEGORIES;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
  } catch { /* ignore malformed JSON */ }
  return DEFAULT_CATEGORIES;
}
```

---

### Task 3: Create `src/lib/anonymiser/pii.ts`

Pure-function module. No external dependencies. Key design:
- Gate on `transactionCode` (full description string).
- Exclude business names via keyword list.
- Exclude names in user whitelist (from localStorage).
- Map unique personal names → a pool of realistic mock Singapore names.
- Return new transaction objects (immutable pattern).

```typescript
// Pseudocode for pii.ts

// 1. Constants
const TRANSFER_CODES = new Set([
  "FAST or PayNow Payment / Receipt",  // DBS ICT
  "Funds Transfer",                     // DBS ITR
]);

const BUSINESS_KEYWORDS = [
  "PTE LTD", "PTE. LTD.", "SDN BHD", "LTD", "LLC", "INC",
  "CORP", "COMPANY", "ENTERPRISE", "ENTERPRISES",
  "SERVICES", "SOLUTIONS", "HOLDINGS", "GROUP",
  "CAFE", "COFFEE", "RESTAURANT", "BAKERY", "KITCHEN",
  "CLINIC", "HOSPITAL", "PHARMACY", "SCHOOL", "ACADEMY",
  "SHOP", "STORE", "MARKET",
];

// Mock name pool — common Singapore names to preserve AI context clues
const MOCK_NAMES = [
  "Alex Tan", "Sam Lim", "Jordan Wong", "Casey Ng", "Morgan Lee",
  "Taylor Chen", "Riley Goh", "Jamie Ong", "Drew Koh", "Quinn Ho",
  "Avery Toh", "Blake Yeo", "Cameron Sim", "Dana Wee", "Elliot Chua",
];

/**
 * Return true if the name matches a known business entity keyword.
 * Case-insensitive match against the whole name.
 */
export function isBusinessName(name: string): boolean {
  const upper = name.toUpperCase();
  return BUSINESS_KEYWORDS.some((kw) => upper.includes(kw));
}

/**
 * Return true if the transactionCode indicates a person-to-person transfer.
 * Only ICT and ITR are candidates for personal-name anonymisation.
 */
export function isTransferTransaction(transactionCode: string): boolean {
  return TRANSFER_CODES.has(transactionCode);
}

/**
 * Load the user-curated whitelist from localStorage.
 * Names in this list bypass anonymisation (e.g. hawker stalls with person-like names).
 */
export function loadWhitelist(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem("lunchprep_pii_whitelist");
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr.map((n) => n.toUpperCase()));
  } catch {
    return new Set();
  }
}

/**
 * Anonymise personal names in transfer transactions.
 *
 * Algorithm:
 * 1. Collect all unique personal names from ICT/ITR transactions.
 * 2. Assign a deterministic mock name from MOCK_NAMES pool to each.
 * 3. Return new transaction objects with description replaced by mock,
 *    and originalPII populated as { mockName: originalName }.
 *
 * Merchant transactions (POS, MST, UMC) are returned unchanged.
 *
 * @param transactions - Input transactions (not mutated).
 * @param whitelist - Optional set of uppercase names to skip (from localStorage).
 * @returns New array of RawTransaction with PII masked.
 */
export function anonymise(
  transactions: RawTransaction[],
  whitelist?: Set<string>
): RawTransaction[] {
  const wl = whitelist ?? loadWhitelist();

  // Build mapping: originalName (uppercase) → assigned mock name
  const nameToMock = new Map<string, string>();
  let mockIndex = 0;

  // First pass: collect unique names
  for (const tx of transactions) {
    if (!isTransferTransaction(tx.transactionCode)) continue;
    if (isBusinessName(tx.description)) continue;
    if (!tx.description || tx.description.trim() === "") continue;

    const upper = tx.description.toUpperCase();
    if (wl.has(upper)) continue;
    if (nameToMock.has(upper)) continue;

    // Assign next mock name from pool, cycling if needed
    nameToMock.set(upper, MOCK_NAMES[mockIndex % MOCK_NAMES.length]);
    mockIndex++;
  }

  // Second pass: apply mapping
  return transactions.map((tx) => {
    if (!isTransferTransaction(tx.transactionCode)) return tx;
    if (isBusinessName(tx.description)) return tx;

    const upper = tx.description.toUpperCase();
    const mockName = nameToMock.get(upper);
    if (!mockName) return tx;

    return {
      ...tx,
      description: mockName,
      originalPII: { ...tx.originalPII, [mockName]: tx.description },
    };
  });
}

/**
 * Restore original PII in transactions after AI categorisation is complete.
 *
 * For each transaction with a non-empty originalPII map, looks up the current
 * description (mock name) in the map and restores the original name.
 *
 * @param transactions - Anonymised transactions.
 * @returns New array with original names restored.
 */
export function restore(transactions: RawTransaction[]): RawTransaction[] {
  return transactions.map((tx) => {
    if (Object.keys(tx.originalPII).length === 0) return tx;
    const original = tx.originalPII[tx.description];
    if (!original) return tx;
    return { ...tx, description: original };
  });
}
```

**Edge cases to handle:**
- Empty `description` string → skip (don't anonymise blank payees like `""`)
- Same original name appears in multiple transactions → same mock name each time
- Mock pool exhausted (> 15 unique names) → cycle with modulo
- `originalPII` already has entries (e.g. from a prior anonymiser run) → spread-merge

---

### Task 4: Create `src/lib/categoriser/prompt.ts`

Pure function, no external dependencies. Converts `RawTransaction[]` to the JSON string
for Gemini's user prompt.

```typescript
// Pseudocode for prompt.ts

export const SYSTEM_INSTRUCTION = `You are an expert financial categoriser for personal expenses in Singapore.
Your job is to assign each transaction exactly one category from the user's provided list.

Rules:
1. Pay attention to the "transactionType" to understand if it's a purchase, transfer, or fee.
2. Consider "notes" which might contain user-provided context or FAST purpose codes.
3. If it looks like a person-to-person transfer (e.g., PayNow to a generic name) and no context is provided, default to "Transfers".
4. Output strict JSON only.`;

/**
 * Shape of a single transaction item in the Gemini request payload.
 */
export interface PromptTransaction {
  index: number;
  payee: string;
  notes: string;
  transactionType: string;
}

/**
 * Build the user-prompt string for the Gemini categorisation request.
 *
 * Returns a JSON string containing the category list and transaction batch.
 *
 * @param transactions - Array of RawTransaction (MUST be anonymised before calling).
 * @param categories - Category list to constrain Gemini's output.
 * @returns Stringified JSON for the Gemini user prompt.
 */
export function buildPrompt(
  transactions: RawTransaction[],
  categories: string[]
): string {
  const items: PromptTransaction[] = transactions.map((tx, i) => ({
    index: i,
    payee: tx.description,
    notes: tx.notes,
    transactionType: tx.transactionCode,
  }));

  return JSON.stringify({
    valid_categories: categories,
    transactions: items,
  }, null, 2);
}
```

---

### Task 5: Create `src/lib/categoriser/client.ts`

Client-side categorisation entry point. Handles both proxy mode and BYOK mode.
This runs in the browser only.

```typescript
// Pseudocode for client.ts
import { buildPrompt, SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import type { RawTransaction } from "@/lib/parsers/types";

export interface CategorisationResult {
  index: number;
  category: string;
}

/**
 * Retrieve the user's BYOK API key from localStorage, if any.
 */
export function getBYOKKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("lunchprep_gemini_key");
}

/**
 * Send anonymised transactions to the categorisation service.
 *
 * Routing logic:
 * - If a BYOK key exists in localStorage: call Gemini directly from the browser.
 * - Otherwise: call the /api/categorise server proxy.
 *
 * @param transactions - Anonymised RawTransaction[] (PII must be masked first).
 * @param categories - Category list. Defaults to DEFAULT_CATEGORIES.
 * @param byokKey - Optional API key override (for testing; normally read from localStorage).
 * @returns Array of { index, category } results.
 * @throws Error with message "RATE_LIMITED:<retryAfter>" on 429.
 * @throws Error with message "SERVER_ERROR" on 500.
 */
export async function callCategorise(
  transactions: RawTransaction[],
  categories: string[] = DEFAULT_CATEGORIES,
  byokKey?: string
): Promise<CategorisationResult[]> {
  const key = byokKey ?? getBYOKKey();

  if (key) {
    // BYOK: call Gemini directly from the browser
    return await _callGeminoDirect(transactions, categories, key);
  } else {
    // Proxy: call /api/categorise
    return await _callProxy(transactions, categories);
  }
}

async function _callProxy(
  transactions: RawTransaction[],
  categories: string[]
): Promise<CategorisationResult[]> {
  const payload = {
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
    body: JSON.stringify(payload),
  });

  if (res.status === 429) {
    const body = await res.json() as { retryAfter: number };
    throw new Error(`RATE_LIMITED:${body.retryAfter}`);
  }
  if (!res.ok) {
    throw new Error("SERVER_ERROR");
  }

  const data = await res.json() as { results: CategorisationResult[] };
  return data.results;
}

async function _callGeminoDirect(
  transactions: RawTransaction[],
  categories: string[],
  apiKey: string
): Promise<CategorisationResult[]> {
  // Dynamically import to avoid SSR issues
  const { GoogleGenerativeAI, SchemaType } = await import("@google/generative-ai");
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
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text) as CategorisationResult[];
}
```

---

### Task 6: Create `src/app/api/categorise/route.ts`

Next.js App Router API route. Server-side only. Uses `@google/generative-ai`.

```typescript
// Pseudocode for route.ts

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "@/lib/categoriser/prompt";

// --- Rate limiter (module-level singleton, persists per process) ---
interface RateWindow { count: number; resetAt: number; }
const ipWindows = new Map<string, RateWindow>();
const RPM_LIMIT = parseInt(process.env.RATE_LIMIT_RPM ?? "10", 10);

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const window = ipWindows.get(ip);
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

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// --- POST handler ---
export async function POST(req: Request): Promise<Response> {
  // 1. Rate limit check
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return Response.json(
      { error: "Rate limit exceeded", retryAfter: rateCheck.retryAfter },
      { status: 429 }
    );
  }

  // 2. Parse and validate body
  let body: { transactions: TransactionInput[]; categories: string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.transactions) || !Array.isArray(body.categories)) {
    return Response.json({ error: "Missing transactions or categories" }, { status: 400 });
  }
  if (body.transactions.length === 0) {
    return Response.json({ results: [] }, { status: 200 });
  }

  // 3. Call Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

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

    // Build user prompt with categories + transaction batch
    const userPrompt = JSON.stringify({
      valid_categories: body.categories,
      transactions: body.transactions,
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const results = JSON.parse(text) as Array<{ index: number; category: string }>;

    return Response.json({ results }, { status: 200 });
  } catch (err) {
    console.error("[/api/categorise] Gemini error:", err);
    return Response.json({ error: "Gemini API failure" }, { status: 500 });
  }
}
```

**Key details:**
- `TransactionInput` interface is inlined (index, payee, notes, transactionType)
- The user prompt is built inline (no import of `buildPrompt` from lib — the route builds the same JSON shape directly to avoid importing client-lib into server)
- `SYSTEM_INSTRUCTION` IS imported from `src/lib/categoriser/prompt.ts` (pure string constant, no browser APIs, safe for server)
- `process.env.GEMINI_MODEL` allows overriding the model name

---

### Task 7: Update `src/lib/exporter/lunchmoney.ts`

Add an optional second parameter `categoriesMap` to `generateLunchMoneyCsv`.

```typescript
// BEFORE (line 49):
export function generateLunchMoneyCsv(transactions: RawTransaction[]): string {
  const rows = transactions.map((tx) => {
    // ...
    const category = ""; // Reason: Category is empty in Phase 1 — filled by AI in Phase 2.
    // ...
  });
  // ...
}

// AFTER:
/**
 * Generate a Lunch Money-compatible CSV string from parsed transactions.
 *
 * @param transactions - Array of RawTransaction objects to export.
 * @param categoriesMap - Optional map from transaction index → category string.
 *   If omitted or if an index has no entry, the category column is left blank.
 * @returns CSV string with headers and one row per transaction.
 */
export function generateLunchMoneyCsv(
  transactions: RawTransaction[],
  categoriesMap?: ReadonlyMap<number, string>
): string {
  const rows = transactions.map((tx, i) => {
    const date = formatDate(tx.date);
    const payee = escapeCsvField(tx.description);
    const amount = tx.amount.toFixed(2);
    // Reason: Use provided category if available; fall back to empty for manual fill.
    const category = escapeCsvField(categoriesMap?.get(i) ?? "");
    const notes = escapeCsvField(tx.notes);
    return `${date},${payee},${amount},${category},${notes}`;
  });
  return [CSV_HEADERS, ...rows].join("\n") + "\n";
}
```

**Backward compatibility:** existing tests pass unchanged since parameter is optional.

---

### Task 8: Create `src/components/transaction-table.tsx`

React client component (must include `"use client"` directive). Shows the review table
with a category dropdown per row. Handles loading and error states.

Uses `radix-ui` Select (v1 unified package pattern matching `button.tsx`).

```typescript
// Pseudocode for transaction-table.tsx
"use client";

import { Select } from "radix-ui";   // v1 unified package
import { cn } from "@/lib/utils";
import type { RawTransaction } from "@/lib/parsers/types";

export type CategorisationStatus = "idle" | "loading" | "done" | "error";

interface TransactionTableProps {
  transactions: RawTransaction[];
  categories: string[];
  categoryMap: Map<number, string>;     // index → selected category
  status: CategorisationStatus;
  onCategoryChange: (index: number, category: string) => void;
}

export function TransactionTable({
  transactions, categories, categoryMap, status, onCategoryChange
}: TransactionTableProps) {
  return (
    <div className="relative">
      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-background/80 backdrop-blur-sm z-10 rounded-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            <span>Categorising transactions…</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {status === "error" && (
        <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10
                        p-3 text-sm text-destructive">
          AI categorisation failed. You can assign categories manually below.
        </div>
      )}

      {/* Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Payee</th>
            <th className="py-2 pr-4 font-medium text-right">Amount</th>
            <th className="py-2 pr-4 font-medium">Category</th>
            <th className="py-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr key={i} className="border-b hover:bg-muted/30">
              <td className="py-1.5 pr-4 whitespace-nowrap">
                {tx.date.toLocaleDateString("en-SG")}
              </td>
              <td className="py-1.5 pr-4">{tx.description}</td>
              <td className={cn("py-1.5 pr-4 text-right tabular-nums",
                tx.amount < 0 ? "text-red-600" : "text-green-600")}>
                {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
              </td>
              <td className="py-1.5 pr-4">
                <Select.Root
                  value={categoryMap.get(i) ?? ""}
                  onValueChange={(val) => onCategoryChange(i, val)}
                >
                  <Select.Trigger className="flex h-7 w-40 items-center justify-between
                    rounded border px-2 text-xs focus:outline-none">
                    <Select.Value placeholder="Select…" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="z-50 rounded border bg-popover shadow-md">
                      <Select.Viewport>
                        {categories.map((cat) => (
                          <Select.Item key={cat} value={cat}
                            className="cursor-pointer px-2 py-1 text-xs
                              hover:bg-accent focus:bg-accent outline-none">
                            <Select.ItemText>{cat}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </td>
              <td className="py-1.5 text-muted-foreground">{tx.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Import for Loader2 icon:** `import { Loader2 } from "lucide-react"` — lucide-react is already installed.

---

### Task 9: Write `tests/anonymiser/pii.test.ts`

Mirror the pattern from `tests/exporter/lunchmoney.test.ts` (makeTx helper, describe/it).

```typescript
// Test coverage required:

// isBusinessName()
describe("isBusinessName", () => {
  it("returns true for 'ABC PTE LTD'");
  it("returns true for 'Food Enterprise'");
  it("returns false for 'Alice Wong'");
  it("returns false for 'John Tan'");
  it("is case-insensitive");
});

// anonymise()
describe("anonymise", () => {
  it("replaces personal name in ICT transaction with mock name");
  it("leaves POS transaction description unchanged");
  it("leaves MST transaction description unchanged");
  it("leaves business name in ICT transaction unchanged ('Grab Pte Ltd')");
  it("populates originalPII with { mockName: originalName }");
  it("assigns the same mock name to the same original name across multiple transactions");
  it("handles empty transactions array");
  it("skips transactions with empty description");
  it("respects the whitelist — does not anonymise whitelisted names");
});

// restore()
describe("restore", () => {
  it("restores original name from originalPII");
  it("leaves non-anonymised transactions unchanged");
  it("handles transactions with empty originalPII");
  it("round-trips: anonymise then restore returns original description");
});
```

**Key test fixture (transactionCodes must match what DBS parser produces):**
```typescript
function makeTx(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    date: new Date(2026, 1, 23),
    description: "Alice Wong",
    originalDescription: "ALICE WONG",
    amount: -50.0,
    transactionCode: "FAST or PayNow Payment / Receipt", // ICT
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

function makePOSTx(): RawTransaction {
  return makeTx({
    description: "Noodle House",
    originalDescription: "NOODLE HOUSE",
    transactionCode: "Point-of-Sale Transaction or Proceeds",
  });
}
```

---

### Task 10: Write `tests/categoriser/prompt.test.ts`

```typescript
// Test coverage required:

// buildPrompt()
describe("buildPrompt", () => {
  it("returns valid JSON string");
  it("includes valid_categories array matching input");
  it("maps each transaction to { index, payee, notes, transactionType }");
  it("index is 0-based array position");
  it("handles empty transactions array — returns JSON with empty transactions array");
  it("transactionType maps to tx.transactionCode (full description string)");
});

// SYSTEM_INSTRUCTION
describe("SYSTEM_INSTRUCTION", () => {
  it("is a non-empty string");
  it("mentions 'Singapore'");
  it("mentions 'JSON'");
});
```

---

### Task 11: Update `tests/exporter/lunchmoney.test.ts`

Add tests for the new optional `categoriesMap` parameter. Do NOT modify existing tests.

```typescript
// Add to the generateLunchMoneyCsv describe block:

it("populates category column when categoriesMap is provided", () => {
  const txs = [
    makeTx({ description: "Noodle House", amount: -9.3 }),
    makeTx({ description: "Bus/Mrt", amount: -1.7 }),
  ];
  const catMap = new Map([[0, "Dining"], [1, "Transport"]]);
  const csv = generateLunchMoneyCsv(txs, catMap);
  const lines = csv.trim().split("\n");
  expect(lines[1]).toBe("2026-02-23,Noodle House,-9.30,Dining,");
  expect(lines[2]).toBe("2026-02-23,Bus/Mrt,-1.70,Transport,");
});

it("leaves category empty for indices not in categoriesMap", () => {
  const txs = [makeTx(), makeTx()];
  const catMap = new Map([[0, "Dining"]]); // index 1 not set
  const csv = generateLunchMoneyCsv(txs, catMap);
  const lines = csv.trim().split("\n");
  const fields2 = lines[2].split(",");
  expect(fields2[3]).toBe(""); // category of index 1
});
```

---

### Task 12: Update `docs/todo.md`

Mark all Phase 2 tasks as complete after all tests pass.

```yaml
MODIFY docs/todo.md:
  - Change "- [ ] Detect personal names..." → "- [x] Detect personal names..."
  - Mark all Phase 2 Anonymisation, Gemini Proxy, UI, and Tests items as [x]
```

---

## Integration Points

```yaml
ENV VARS (already templated in .env.local):
  - GEMINI_API_KEY: required for /api/categorise
  - GEMINI_MODEL: defaults to "gemini-2.5-flash-lite"
  - RATE_LIMIT_RPM: defaults to "10"

IMPORTS chain:
  - src/app/api/categorise/route.ts
      imports: @google/generative-ai, @/lib/categoriser/prompt (SYSTEM_INSTRUCTION only)
  - src/lib/categoriser/client.ts
      imports: @google/generative-ai (dynamic), @/lib/categoriser/prompt, @/lib/categoriser/categories
  - src/components/transaction-table.tsx
      imports: radix-ui, @/lib/utils, @/lib/parsers/types
  - src/lib/anonymiser/pii.ts
      imports: @/lib/parsers/types (RawTransaction)

PAGE WIRING (src/app/page.tsx) — minimal for Phase 2:
  - Keep existing placeholder text (full UI wiring is Phase 3)
  - OR add a minimal demo if desired: not required for Phase 2 completion
```

---

## Validation Loop

### Level 1: TypeScript compilation (run FIRST)
```bash
npx tsc --noEmit
# Expected: 0 errors.
# Common errors to fix:
#   - "Cannot find module '@google/generative-ai'" → npm install @google/generative-ai
#   - "Type 'X' is not assignable..." → check interface shapes
#   - "Property 'originalPII' does not exist" → import RawTransaction from types.ts
```

### Level 2: Unit tests
```bash
# Run all tests
npm test

# Run individual test files for faster iteration:
npx vitest run tests/anonymiser/pii.test.ts --reporter=verbose
npx vitest run tests/categoriser/prompt.test.ts --reporter=verbose
npx vitest run tests/exporter/lunchmoney.test.ts --reporter=verbose

# Expected: all pass. If failing, read the error, fix the source, re-run.
# NEVER mock functions to make tests pass — fix the real code.
```

### Level 3: Build check
```bash
npm run build
# Expected: clean build with no errors.
# If "Module not found": check import paths use @/ alias for src/ files.
```

### Level 4: Manual API test (requires GEMINI_API_KEY in .env.local)
```bash
npm run dev
# In another terminal:
curl -s -X POST http://localhost:3000/api/categorise \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {"index":0,"payee":"Noodle House Stall","notes":"","transactionType":"Point-of-Sale Transaction or Proceeds"},
      {"index":1,"payee":"Alex Tan","notes":"dinner","transactionType":"FAST or PayNow Payment / Receipt"}
    ],
    "categories": ["Dining","Groceries","Transport","Transfers","Other"]
  }'

# Expected: {"results":[{"index":0,"category":"Dining"},{"index":1,"category":"Transfers"}]}

# Rate limit test (run 11 times from same IP):
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:3000/api/categorise \
  -H "Content-Type: application/json" \
  -d '{"transactions":[{"index":0,"payee":"test","notes":"","transactionType":"x"}],"categories":["Other"]}'; done
# Expected: 200 x 10, then 429 on the 11th request.
```

---

## Final Validation Checklist

- [ ] `npm install @google/generative-ai` completed
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm test` → all tests pass (including pre-existing dbs.test.ts and lunchmoney.test.ts)
- [ ] `anonymise()` + `restore()` round-trip works for ICT/ITR transactions
- [ ] `anonymise()` does NOT modify POS/MST transactions
- [ ] `isBusinessName("Grab Pte Ltd")` returns `true`
- [ ] `isBusinessName("Alice Wong")` returns `false`
- [ ] `buildPrompt()` returns parseable JSON with correct shape
- [ ] `/api/categorise` POST returns 200 with `{ results: [...] }`
- [ ] `/api/categorise` returns 429 after 10 RPM exceeded
- [ ] `generateLunchMoneyCsv(txs, catMap)` fills category column
- [ ] `generateLunchMoneyCsv(txs)` (no catMap) still leaves category empty (backward compat)
- [ ] `docs/todo.md` Phase 2 items marked complete
- [ ] `npm run build` → clean build

---

## Anti-Patterns to Avoid

- ❌ Do NOT mutate `RawTransaction` objects — always return `{ ...tx, fieldToChange: newVal }`
- ❌ Do NOT import `@google/generative-ai` in anonymiser or categories — these are pure functions
- ❌ Do NOT call `localStorage` at module import time — always guard with `typeof window !== "undefined"`
- ❌ Do NOT add BYOK key handling in `route.ts` — the server never handles user keys
- ❌ Do NOT use `"use client"` in lib files (`src/lib/**`) — only in `src/components/**`
- ❌ Do NOT use short code strings `"ICT"` or `"ITR"` to gate anonymisation — use the full descriptions from dbs_codes.json
- ❌ Do NOT hardcode `"gemini-2.5-flash-lite"` in `client.ts` — use the constant from a shared location (or just hardcode it once and document it)
- ❌ Do NOT catch all exceptions silently — log to console.error and re-throw or return proper error responses
- ❌ Do NOT create files over 500 lines — split into sub-modules if needed
- ❌ Do NOT skip JSDoc on exported functions

---

## PRP Score: 9/10

**Confidence rationale:** The PRP provides exact interface contracts, full pseudocode for every
module, known gotchas (transactionCode full descriptions, originalPII direction, radix-ui v1
import pattern), executable validation gates, and references all critical existing files.
The one risk is that `@google/generative-ai`'s `responseSchema` / `SchemaType` API may have
minor version-specific differences — if the model's structured output fails, fall back to
`responseMimeType: "application/json"` without `responseSchema` and validate the response shape
post-parse.
