# Architecture & Technical Design

## Data Flow
```
Browser: Upload CSV → Parse (DBS) → Clean & Anonymise → [Restore Names] → Review/Edit → Download CSV
                                                ↓
                                    Next.js /api/categorise (proxy)
                                                ↓
                                    Gemini 2.5 Flash-Lite
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
│   │   ├── types.ts              # BankParser interface, RawTransaction type
│   │   ├── dbs.ts                # DBS parser + cleaner
│   │   └── registry.ts           # Auto-detect bank from CSV headers
│   ├── anonymiser/names.ts       # Extract names → placeholders → restore
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
├── anonymiser/names.test.ts
└── exporter/lunchmoney.test.ts
```

## Core Interfaces
```typescript
interface RawTransaction {
  date: Date;
  description: string;          // Cleaned payee
  originalDescription: string;  // Raw bank string
  amount: number;               // Negative=debit, positive=credit
  transactionCode: string;      // POS | MST | ICT | ITR
  notes: string;                // OTHR field contents
  personalNames: string[];      // Real names (output only, not sent to AI)
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
