# Architecture & Technical Design

## Data Flow
``` text
[User]   Uploads Bank CSV
            ↓
[App]    Parse Bank CSV & Clean Data
            ↓
[App]    Substitute PII with Mock Data 
            │    (Merchants are preserved so AI can categorise accurately)
            ↓
            ├──→ Next.js /api/categorise (stateless proxy) ──→ Gemini 2.5 Flash-Lite
            ↓
[App]    Restore Original PII
            ↓
[User]   Review & Edit Data in Table
            ↓
[User]   Download Final Import CSV
```
Server is a stateless proxy only — no storage, no logging. All CSV processing stays client-side.

## Directory Structure
```
src/
├── app/
│   ├── page.tsx                  # Wizard UI
│   ├── layout.tsx
│   └── api/categorise/route.ts   # Gemini proxy + rate limiting
├── lib/
│   ├── parsers/
│   │   ├── data/
│   │   │   └── dbs_codes.json    # Static JSON dictionary: 928 DBS transaction codes → descriptions
│   │   ├── types.ts              # BankParser interface, RawTransaction type
│   │   ├── dbs.ts                # DBS parser + cleaner
│   │   └── registry.ts           # Auto-detect bank from CSV headers
│   ├── anonymiser/pii.ts         # Extract PII → mock replacement → restore
│   ├── categoriser/
│   │   ├── prompt.ts             # Gemini prompt builder
│   │   └── categories.ts         # Default + user-defined categories
│   └── exporter/lunchmoney.ts    # Lunch Money CSV generator
└── components/
    ├── file-upload.tsx
    ├── transaction-table.tsx      # Editable review table
    ├── category-editor.tsx
    ├── pipeline-steps.tsx
    └── api-key-input.tsx          # BYOK

tests/
├── parsers/dbs.test.ts
├── anonymiser/pii.test.ts
└── exporter/lunchmoney.test.ts
```

## Core Interfaces
```typescript
interface RawTransaction {
  date: Date;
  description: string;          // Primary payee/merchant identified for AI
  originalDescription: string;  // Raw bank string
  amount: number;               // Negative=debit, positive=credit
  transactionCode: string;      // Identifier code (e.g. POS, MST, ICT, ITR, etc.)
  notes: string;                // Crucial context for AI (e.g. memos after 'OTHR' like 'Gong Xi Fa Cai'); PII is substituted
  originalPII: Record<string, string>; // Map of mock values back to original PII (not sent to AI)
}

interface BankParser {
  bankName: string;
  detect(csvContent: string): boolean;  // Match on CSV headers/structure
  parse(csvContent: string): RawTransaction[];
}
```

Registry auto-selects the correct parser; adding a bank = adding one file implementing `BankParser`.

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 15 + TypeScript |
| UI | shadcn/ui + Tailwind CSS 4 |
| CSV parsing | PapaParse (client-side) |
| AI | Gemini 2.5 Flash-Lite via `@google/generative-ai` |
| Testing | Vitest |
| Deploy | Vercel (primary), Docker (self-hosted) |

## Config
| Variable | Required | Default |
|---|---|---|
| `GEMINI_API_KEY` | Yes (hosted mode) | — |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` |
| `RATE_LIMIT_RPM` | No | `10` |
