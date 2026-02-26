# PRP: DBS CSV Parser Pipeline

**Confidence Score: 9/10** — All specs, sample data, interfaces, and edge cases are fully documented. The only risk is subtle regex edge cases in MST merchant cleaning, mitigated by comprehensive test fixtures.

---

## Goal

Build the complete DBS CSV parser pipeline: TypeScript modules that parse a raw DBS bank CSV string into cleaned `RawTransaction[]` objects, auto-detect the bank via a parser registry, export to Lunch Money CSV format, and trigger a browser download. Include comprehensive Vitest unit tests using `sample_input.csv` as the primary fixture.

## Why

- **Foundation for the entire app** — Phase 1 parser + exporter is the critical path; every subsequent feature (AI categorisation, review table, PII anonymisation) depends on correctly parsed transactions
- **49 real transactions** in `sample_input.csv` covering all 4 transaction codes and 9 sub-types ensure robust test coverage
- **Privacy-first** — PII stripping happens at parse time, before any data leaves the client

## What

### User-Visible Behavior
- Parse a DBS bank CSV file into structured `RawTransaction[]` with cleaned payee names and notes
- Auto-detect DBS format from CSV headers
- Export transactions to Lunch Money CSV format (`date,payee,amount,category,notes`)
- Trigger browser download of the export file

### Success Criteria
- [ ] All 49 rows from `sample_input.csv` parse without errors
- [ ] Each transaction code (POS, MST, ICT, ITR) produces correct payee and notes
- [ ] Row 38 (mismatched Description vs Ref2) parses correctly from Ref2
- [ ] PII (card numbers, phone numbers, long refs) is stripped from all output
- [ ] Exported CSV matches Lunch Money format exactly
- [ ] All Vitest tests pass: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] `docs/todo.md` updated with completed tasks

---

## All Needed Context

### Documentation & References
```yaml
- file: docs/architecture.md
  why: "Core interfaces (RawTransaction, BankParser), directory structure, stack choices"

- file: specs/bank-parsing.md
  why: "PRIMARY SPEC — cleaning rules per transaction code, transformation table, PII stripping rules"

- file: docs/dbs_formats.md
  why: "Raw DBS CSV field layouts per transaction code/sub-type — essential for regex patterns"

- file: specs/output.md
  why: "Lunch Money CSV format, filename convention, constraints (3MB, 10K rows)"

- file: sample_input.csv
  why: "49 real DBS transactions — primary test fixture covering all codes and edge cases"

- file: src/lib/parsers/data/dbs_codes.json
  why: "928 DBS transaction code → description mappings for transactionCode field"

- file: INITIAL.md
  why: "Feature spec with worked examples for every transaction sub-type and gotchas"

- url: https://www.papaparse.com/docs
  why: "PapaParse API — use Papa.parse(csvString, { header: true, skipEmptyLines: true })"

- file: CLAUDE.md
  why: "Global coding standards, JSDoc requirements, testing requirements, import conventions"
```

### Current Codebase Tree
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/
│       └── button.tsx
└── lib/
    ├── utils.ts
    └── parsers/
        └── data/
            └── dbs_codes.json

tests/
└── setup.test.ts

docs/
├── prd.md
├── architecture.md
├── todo.md
└── dbs_formats.md

specs/
├── bank-parsing.md
├── ai-categorisation.md
└── output.md
```

### Desired Codebase Tree (new files marked with ★)
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/
│       └── button.tsx
└── lib/
    ├── utils.ts
    └── parsers/
        ├── types.ts          ★ RawTransaction & BankParser interfaces
        ├── dbs.ts            ★ DBS parser: header skipping, date/amount parsing, per-code cleaning
        ├── registry.ts       ★ detectAndParse() — auto-detect bank from CSV headers
        └── data/
            └── dbs_codes.json

src/lib/exporter/
└── lunchmoney.ts             ★ CSV string generator + browser download trigger

tests/
├── setup.test.ts
├── parsers/
│   └── dbs.test.ts           ★ Comprehensive DBS parser tests
└── exporter/
    └── lunchmoney.test.ts    ★ Export format validation tests
```

### Known Gotchas

```typescript
// CRITICAL: DBS CSVs have 6 metadata rows before actual headers on row 7.
// You CANNOT pass the entire file to PapaParse with header: true.
// Solution: Split by newlines, discard lines 0-5 (rows 1-6), rejoin, then parse.
// Row 1: "Account Details For:,Savings Plus Account 045-812-456-7,,,,,,,"
// Row 7: "Transaction Date,Transaction Code,Description,Transaction Ref1,..."

// CRITICAL: Always parse from Ref1/Ref2/Ref3 columns, NOT from Description.
// Description = Ref1 + ' ' + Ref2 + ' ' + Ref3 concatenated, can be TRUNCATED.
// Row 38 example: Description says "CITY TAXI DRIVING SCHOOL" but Ref2 says
// "To: COMFORTDELGRO       DRIVING CEN" — DIFFERENT payees. Use Ref2.

// CRITICAL: MST merchant ref stripping order matters.
// 1. Match and remove acquirer suffix FIRST: /\s+[A-Za-z]{2}\s+[A-Z]{3}\s+\d{2}[A-Z]{3}$/i
//    e.g. "BURGER KING (XYZ)       SI SGP 18FEB" → "BURGER KING (XYZ)"
// 2. THEN strip trailing all-numeric token: /\s+\d+$/
//    e.g. "BUS/MRT 799701767" → "BUS/MRT"
// 3. Trim whitespace
// DO NOT strip numeric parts that are part of merchant names like "ABC1234" (POS, not MST)

// CRITICAL: ICT "PayNow transfer" is a DBS default placeholder note.
// Per spec, the notes field should be set to "" when Ref3 after stripping OTHR
// equals "PayNow transfer" (case-insensitive comparison).

// CRITICAL: PapaParse needs to be installed — it's NOT in package.json yet.
// Run: npm install papaparse && npm install -D @types/papaparse

// GOTCHA: Title-casing must handle:
// - Slashes: "BUS/MRT" → "Bus/Mrt" (title-case each segment around /)
// - Hyphens: "SG-PAYMENT" → "Sg-Payment" (title-case each segment around -)
// - Collapse multiple whitespace FIRST: "COMFORTDELGRO       DRIVING CEN" → "Comfortdelgro Driving Cen"
// - Parentheses: "BURGER KING (XYZ)" → "Burger King (Xyz)"

// GOTCHA: Amount fields — DBS has separate Debit Amount and Credit Amount columns.
// Exactly one is populated per row. The other is empty string or missing.
// Debit → NEGATIVE (expense), Credit → POSITIVE (income).
// Always round: Math.round(amount * 100) / 100

// GOTCHA: Date parsing — DBS format is "23 Feb 2026" (DD Mon YYYY).
// Use: new Date(dateString) works for this format, but verify timezone handling.
// Better: manually parse to avoid timezone issues.

// GOTCHA: Export format — category column must be EMPTY in Phase 1.
// Filename: lunchprep-export-YYYY-MM-DD.csv (today's date, not transaction date)

// GOTCHA: ICT external bank INCOMING — refs are unmeaningful alphanumeric strings.
// There are NO incoming external bank transfers in sample_input.csv, but the parser
// must handle them. Set payee to bank name or generic label, notes empty.

// GOTCHA: Browser download uses URL.createObjectURL + anchor click pattern.
// In tests, mock document.createElement and URL.createObjectURL.
```

---

## Implementation Blueprint

### Data Models

```typescript
// src/lib/parsers/types.ts — IMPLEMENT EXACTLY AS SPECIFIED IN docs/architecture.md

/**
 * A single cleaned bank transaction.
 */
export interface RawTransaction {
  date: Date;
  description: string;          // Cleaned payee/merchant name (title-cased, PII stripped)
  originalDescription: string;  // Raw Description column value (untouched)
  amount: number;               // Negative = debit, positive = credit, 2 d.p.
  transactionCode: string;      // e.g. "POS", "MST", "ICT", "ITR"
  notes: string;                // Context like PayNow OTHR field (stripped of refs)
  originalPII: Record<string, string>; // Empty {} for Phase 1
}

/**
 * Interface that all bank-specific parsers must implement.
 */
export interface BankParser {
  bankName: string;
  detect(csvContent: string): boolean;
  parse(csvContent: string): RawTransaction[];
}
```

### Task List

```yaml
Task 1: Install dependencies
  RUN: npm install papaparse && npm install -D @types/papaparse

Task 2: Create src/lib/parsers/types.ts
  CREATE: RawTransaction and BankParser interfaces
  REFERENCE: docs/architecture.md Core Interfaces section
  MUST: Use named exports, add JSDoc comments

Task 3: Create src/lib/parsers/dbs.ts
  CREATE: DBS parser implementing BankParser interface
  CONTAINS:
    - skipMetadataRows(): Strip rows 1-6, return data from row 7 onwards
    - parseDate(): "23 Feb 2026" → Date object for 2026-02-23
    - parseAmount(): Debit/Credit columns → signed number, 2 d.p.
    - titleCase(): Smart title-casing with /,- handling and whitespace collapse
    - cleanPOS(): Extract payee from Ref2, strip "TO: " prefix
    - cleanMST(): Extract merchant from Ref1 before acquirer suffix, strip numeric ref
    - cleanICT(): Handle PayNow in/out, external bank in/out sub-types
    - cleanITR(): Handle PayLah! withdrawal/top-up, DBS transfers
    - stripPII(): Remove card numbers, phone numbers, long alphanumeric refs
    - parse(): Orchestrator — skip headers, parse rows, dispatch to cleaners
    - detect(): Match on DBS CSV header row pattern
  REFERENCE: specs/bank-parsing.md, docs/dbs_formats.md, INITIAL.md examples
  FILE LIMIT: Keep under 500 lines — extract helpers if needed

Task 4: Create src/lib/parsers/registry.ts
  CREATE: detectAndParse() function
  LOGIC:
    - Import all BankParser implementations (just DBS for now)
    - Iterate parsers, call detect() on each
    - Return first match's parse() result
    - Throw descriptive error if no parser matches
  REFERENCE: docs/architecture.md registry description

Task 5: Create src/lib/exporter/lunchmoney.ts
  CREATE: Two exported functions:
    - generateLunchMoneyCsv(transactions: RawTransaction[]): string
      → Headers: date,payee,amount,category,notes
      → Date: YYYY-MM-DD format
      → Amount: 2 d.p. (e.g. -9.30, 200.00)
      → Category: empty string (Phase 1)
      → Notes: as-is from RawTransaction
      → Properly escape CSV values containing commas/quotes
    - downloadCsv(csvContent: string, filename?: string): void
      → Default filename: lunchprep-export-YYYY-MM-DD.csv (today's date)
      → Create Blob, URL.createObjectURL, anchor click, cleanup
  REFERENCE: specs/output.md, INITIAL.md Export Format section

Task 6: Create tests/parsers/dbs.test.ts
  CREATE: Comprehensive test file using sample_input.csv as fixture
  FIXTURE: Read sample_input.csv via fs.readFileSync in test setup
  TEST CASES:
    - detect(): returns true for DBS CSV, false for non-DBS
    - parse(): returns 42 transactions from sample (49 lines - 7 header lines... actually 49 data rows on lines 8-49 = 42 transactions)
    - POS cleaning: "TO: NOODLE HOUSE STALL" → "Noodle House Stall"
    - MST cleaning: "BURGER KING (XYZ)       SI SGP 18FEB" → "Burger King (Xyz)"
    - MST with numeric ref: "BUS/MRT 799701767      SI SGP 14FEB" → "Bus/Mrt"
    - MST edge: "FastFood 123456       Si SGP 06FEB" → "Fastfood"
    - ICT PayNow outgoing: payee from Ref2, notes from Ref3 (strip OTHR)
    - ICT PayNow incoming: payee from Ref2 (strip "From: "), notes handling
    - ICT PayNow with default note: "PayNow transfer" → notes should be ""
    - ICT external bank: payee = bank name from Ref1, notes from Ref2
    - ITR PayLah! withdrawal: payee = "PayLah!", notes = "Received"
    - Row 38 edge case: Ref2 "To: COMFORTDELGRO       DRIVING CEN" → "Comfortdelgro Driving Cen"
    - PII stripping: card numbers, phone numbers, long refs removed
    - Amount: debit → negative, credit → positive
    - Date parsing: "23 Feb 2026" → 2026-02-23
    - Failure: empty string throws, malformed CSV throws
    - Edge: POS with alphanumeric merchant name "ABC1234" preserved
  IMPORTANT: Count the actual data rows carefully. Lines 8-49 in sample_input.csv = 42 data rows.

Task 7: Create tests/exporter/lunchmoney.test.ts
  CREATE: Export format validation tests
  TEST CASES:
    - Happy path: generates correct CSV with headers
    - Date formatting: Date objects → YYYY-MM-DD strings
    - Amount formatting: -9.3 → "-9.30", 200 → "200.00"
    - Category always empty in Phase 1
    - Notes with commas properly escaped
    - Empty transactions → headers only
    - downloadCsv: verify Blob creation and anchor click (mock DOM)

Task 8: Validate everything
  RUN: npx tsc --noEmit  (TypeScript check)
  RUN: npm test           (all Vitest tests)
  FIX: Any failures, iterate until green

Task 9: Update docs/todo.md
  MARK COMPLETED:
    - "Define RawTransaction & BankParser interfaces (types.ts)"
    - "Parser registry & detectAndParse()"
    - All DBS parser sub-tasks (skip headers, parse dates, parse amounts, clean POS/MST/ICT/ITR, strip PII)
    - "Lunch Money CSV exporter (lunchmoney.ts)"
    - "Unit tests for parser & exporter"
```

### Per-Task Pseudocode

#### Task 3: DBS Parser (core complexity)

```typescript
// src/lib/parsers/dbs.ts

import Papa from "papaparse";
import type { BankParser, RawTransaction } from "./types";
// Import dbs_codes.json for transactionCode descriptions (resolveJsonModule enabled in tsconfig)

// --- Header constants ---
const DBS_HEADERS = [
  "Transaction Date", "Transaction Code", "Description",
  "Transaction Ref1", "Transaction Ref2", "Transaction Ref3",
  "Status", "Debit Amount", "Credit Amount"
];

// --- Helper: Skip metadata rows ---
// Split csvContent by newlines, discard first 6 lines, rejoin
// Reason: DBS CSVs have account info in rows 1-6, actual headers on row 7

// --- Helper: Parse date ---
// "23 Feb 2026" → Date(2026, 1, 23) — month is 0-indexed
// Use month name lookup, NOT new Date(string) to avoid timezone issues
const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};
// Split on space: ["23", "Feb", "2026"] → new Date(2026, 1, 23)

// --- Helper: Parse amount ---
// (debitStr: string, creditStr: string) → number
// If debitStr is non-empty and parseable → return -Math.round(parseFloat(debit) * 100) / 100
// If creditStr is non-empty and parseable → return Math.round(parseFloat(credit) * 100) / 100
// If neither → throw Error

// --- Helper: Title case ---
// 1. Collapse multiple whitespace to single space, trim
// 2. Split on space
// 3. For each word: split on / and -, title-case each segment, rejoin
// 4. Title-case segment: first char upper, rest lower
// "COMFORTDELGRO       DRIVING CEN" → "Comfortdelgro Driving Cen"
// "BUS/MRT" → "Bus/Mrt"
// "SG-PAYMENT" → "Sg-Payment"
// "BURGER KING (XYZ)" → "Burger King (Xyz)" — handle ( as word boundary

// --- Helper: Strip PII ---
// Remove patterns from a string:
// 1. Card numbers: /\d{4}-\d{4}-\d{4}-\d{4}/g
// 2. Long numeric refs (15+ digits): /\b\d{15,}\b/g
// 3. Long alphanumeric refs (15+ chars, mixed): /\b[A-Za-z0-9]{15,}\b/g
//    BUT be careful not to strip meaningful text — only apply to notes field
// Apply to payee and notes fields after cleaning

// --- Cleaner: POS ---
// ref2.replace(/^TO:\s*/i, '') → titleCase → payee
// notes = ""

// --- Cleaner: MST ---
// Step 1: Remove acquirer suffix from ref1
//   regex: /\s+[A-Za-z]{2,3}\s+[A-Z]{2,3}\s+\d{2}[A-Z]{3}$/i
//   "BURGER KING (XYZ)       SI SGP 18FEB" → "BURGER KING (XYZ)"
// Step 2: Trim, then strip trailing all-numeric token
//   regex: /\s+\d+$/
//   "BUS/MRT 799701767" → "BUS/MRT"
// Step 3: Trim → titleCase → payee
// notes = ""

// --- Cleaner: ICT ---
// Detect sub-type from ref1:
//   if ref1 starts with "PayNow Transfer" → outgoing PayNow
//   if ref1 starts with "Incoming PayNow" → incoming PayNow
//   if ref1 matches /^.+:\d+:I-BANK$/i → outgoing external bank
//   else → incoming external bank (unmeaningful refs)
//
// PayNow outgoing:
//   payee = ref2.replace(/^To:\s*/i, '') → collapse whitespace → titleCase
//   notes = ref3.replace(/^OTHR\s*/i, '') → strip long refs
//   if notes.toLowerCase() === "paynow transfer" → notes = ""
//
// PayNow incoming:
//   payee = ref2.replace(/^From:\s*/i, '') → titleCase
//   notes = ref3.replace(/^OTHR\s*/i, '') → strip long refs
//   if notes.toLowerCase() === "paynow transfer" → notes = ""
//
// External bank outgoing:
//   payee = ref1.split(":")[0] → titleCase (e.g. "Trus")
//   notes = ref2 (user input note, no OTHR prefix)
//   // Ignore ref3 (just "OTHR <ref number>")
//
// External bank incoming:
//   payee = "External Transfer"  // refs are unmeaningful
//   notes = ""

// --- Cleaner: ITR ---
// Detect sub-type from ref1:
//   if ref1 starts with "SEND BACK FROM PAYLAH!" → PayLah! withdrawal
//   if ref1 starts with "TOP UP TO PAYLAH!" → PayLah! top-up
//   if ref1 === "DBS:I-BANK" → outgoing DBS transfer
//   else → incoming DBS transfer
//
// PayLah! withdrawal: payee = "PayLah!", notes = "Received"
// PayLah! top-up: payee = "PayLah!", notes = "Top-Up"
// Outgoing DBS: payee = "Dbs", notes = ref3.replace(/^OTHR\s*/i, '').replace(/\s+\d+$/, '').trim()
// Incoming DBS: payee = "Dbs", notes = ""
// IMPORTANT: ref2 for PayLah! is phone number — DO NOT output it (PII)

// --- Main parse() ---
// 1. skipMetadataRows(csvContent)
// 2. Papa.parse(dataContent, { header: true, skipEmptyLines: true })
// 3. For each row:
//    a. Parse date, amount, get transaction code
//    b. Dispatch to cleaner based on code
//    c. Strip PII from payee and notes
//    d. Build RawTransaction object
// 4. Return RawTransaction[]

// --- detect() ---
// Check if CSV content contains the DBS header row
// Look for "Transaction Date" AND "Transaction Ref1" in the first 10 lines
// This distinguishes DBS from other bank formats
```

#### Task 5: Exporter

```typescript
// src/lib/exporter/lunchmoney.ts

// generateLunchMoneyCsv(transactions: RawTransaction[]): string
// 1. Header line: "date,payee,amount,category,notes"
// 2. For each transaction:
//    - date: format Date as YYYY-MM-DD
//    - payee: escape if contains comma/quote (wrap in quotes, double any quotes)
//    - amount: .toFixed(2)
//    - category: "" (empty, Phase 1)
//    - notes: escape if contains comma/quote
// 3. Join with \n, ensure trailing newline

// downloadCsv(csvContent: string, filename?: string): void
// 1. Default filename: `lunchprep-export-${YYYY-MM-DD}.csv`
// 2. Create Blob with type 'text/csv;charset=utf-8;'
// 3. URL.createObjectURL(blob)
// 4. Create <a> element, set href + download, click(), remove
// 5. URL.revokeObjectURL()
```

### Integration Points

```yaml
DEPENDENCY:
  - install: "npm install papaparse && npm install -D @types/papaparse"
  - verify: package.json updated with papaparse dependency

IMPORTS:
  - src/lib/parsers/dbs.ts imports from: ./types, papaparse, ./data/dbs_codes.json
  - src/lib/parsers/registry.ts imports from: ./types, ./dbs
  - src/lib/exporter/lunchmoney.ts imports from: ../parsers/types
  - tests/ import from: @/lib/parsers/dbs, @/lib/parsers/types, @/lib/exporter/lunchmoney

TEST FIXTURE:
  - tests/parsers/dbs.test.ts reads: sample_input.csv via fs.readFileSync
  - path: path.resolve(__dirname, '../../sample_input.csv') or similar
  - Use import { readFileSync } from 'fs' and import path from 'path'

TODO:
  - update: docs/todo.md — check off all Phase 1 parser + exporter tasks
```

---

## Expected Test Output Reference

Use this table to validate parser output against `sample_input.csv`. Each row shows the expected cleaned payee and notes for key transactions:

| Row | Code | Expected Payee | Expected Notes | Amount |
|-----|------|----------------|----------------|--------|
| 8   | POS  | Noodle House Stall | | -9.30 |
| 9   | MST  | Burger King (Xyz) | | -28.45 |
| 10  | MST  | Bus/Mrt | | -1.28 |
| 11  | POS  | Hong Kong Dim Sum Factory | | -14.30 |
| 12  | ICT  | Alice Wong | | 200.00 |
| 13  | MST  | Value Mart Groceries | | -16.20 |
| 17  | ICT  | Government Agency Office | QR240219194137 | -45.00 |
| 18  | ICT  | Bob Tan | | 23.00 |
| 20  | ICT  | Trus | Transfer | -100.00 |
| 21  | ICT  | Sunrise | | -38.00 |
| 25  | ICT  | Charlie Lim | Gong Xi Fa Cai | 255.00 |
| 28  | ICT  | David Chew | mixed rice | -3.80 |
| 29  | POS  | Abc1234 | | -3.20 |
| 31  | ICT  | Stripe Sg-Payment Gate | | -9.50 |
| 33  | ICT  | Ocean Catch Seafood Pte. Ltd. | san lor horfun | -6.30 |
| 34  | ICT  | Eve Low | sin to urc ticket | -666.00 |
| 38  | ICT  | Comfortdelgro Driving Cen | | -42.00 |
| 41  | ICT  | George Chua | paylater debt | -1.00 |
| 42  | ICT  | George Chua | pay off debts paylter | -31.80 |
| 43  | ITR  | PayLah! | Received | 15.00 |
| 44  | ITR  | PayLah! | Received | 23.84 |
| 45  | ICT  | Pos-System-Retailstore | | -6.30 |
| 46  | MST  | Fastfood | | -9.80 |
| 48  | POS  | Noodle House Stall | | -4.00 |

**Notes on specific rows:**
- Row 12 (Alice Wong, incoming PayNow): notes="PayNow transfer" is the DBS default → strip to ""
- Row 17 (Gov Agency): notes should be "QR240219194137" (OTHR prefix stripped, but the QR ref itself is the user's note context, keep it)
- Row 21 (Sunrise): Ref3 is "OTHR QSSGQRSTAR1234" → notes="" since QSSGQRSTAR1234 looks like a long ref, BUT it's only 14 chars. Check your PII stripping threshold. If <15 chars, keep it. Actually re-examining: the spec says to strip reference strings. This is a QR ref. Let me re-check — the INITIAL.md example for Gov Agency shows notes: "QR240219194137". So QR refs ARE kept as notes. For Sunrise, notes should be "QSSGQRSTAR1234".
- Row 31 (Stripe): Ref3 "OTHR HT7S53DNK2Z7RW99" → after stripping OTHR, "HT7S53DNK2Z7RW99" is 16 chars alphanumeric ref → strip as PII → notes=""
- Row 38: CRITICAL edge case — Description says "CITY TAXI DRIVING SCHOOL" but Ref2 says "COMFORTDELGRO       DRIVING CEN". Always use Ref2.
- Row 45 (POS-System-RetailStore): Ref3 "OTHR qsb-sqr-sg-38231108740123" → after OTHR strip, contains hyphens and is 26 chars → strip as long ref → notes=""

---

## Validation Loop

### Level 1: TypeScript Compilation
```bash
# Run FIRST — fix any type errors before proceeding
npx tsc --noEmit

# Expected: No errors. If errors, read and fix.
```

### Level 2: Unit Tests
```bash
# Run parser tests
npx vitest run tests/parsers/dbs.test.ts

# Run exporter tests
npx vitest run tests/exporter/lunchmoney.test.ts

# Run ALL tests (includes setup.test.ts)
npm test

# If failing: Read error output, understand root cause, fix code, re-run.
# NEVER mock to make tests pass — fix the actual logic.
```

### Level 3: Integration Smoke Test
```bash
# Quick integration check — parse sample and verify output
# Add a one-off script or test that:
# 1. Reads sample_input.csv
# 2. Calls detectAndParse()
# 3. Calls generateLunchMoneyCsv()
# 4. Prints the CSV to stdout
# 5. Verify it matches expected Lunch Money format
# This can be a test case in dbs.test.ts (integration section)
```

---

## Final Validation Checklist
- [ ] `npm install` succeeds (papaparse added)
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm test` — all tests pass
- [ ] Parser handles all 42 data rows from sample_input.csv
- [ ] POS, MST, ICT (PayNow in/out, external bank), ITR (PayLah!) all produce correct output
- [ ] Row 38 edge case: payee comes from Ref2, not Description
- [ ] PII stripped: no card numbers, phone numbers, or long refs in output
- [ ] Export CSV has correct headers: `date,payee,amount,category,notes`
- [ ] Export amounts formatted to 2 d.p.
- [ ] Export dates in ISO 8601 format
- [ ] Export category column is empty
- [ ] `docs/todo.md` updated with completed tasks
- [ ] All files have JSDoc comments on significant functions
- [ ] No file exceeds 500 lines
- [ ] Named exports only (no default exports)
- [ ] All imports use `@/` alias for src/ paths

---

## Anti-Patterns to Avoid
- Do NOT parse from the Description column — always use Ref1, Ref2, Ref3
- Do NOT use `new Date(dateString)` for parsing — manually parse to avoid timezone issues
- Do NOT strip numeric parts of POS merchant names (e.g. "ABC1234" is a real name)
- Do NOT include PII (card numbers, phone numbers) in any output field
- Do NOT create default exports — use named exports only
- Do NOT hardcode test expectations — derive from sample_input.csv fixture
- Do NOT skip the metadata row stripping — PapaParse will misparse without it
- Do NOT modify existing files in `docs/`, `specs/`, or `src/lib/parsers/data/` (except `docs/todo.md`)
- Do NOT use `any` type — use proper interfaces
- Do NOT catch generic exceptions — be specific about error types
