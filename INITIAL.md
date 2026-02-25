## FEATURE:

Build the **DBS CSV parser pipeline** — a set of TypeScript modules that parse a raw DBS bank CSV string into cleaned `RawTransaction[]` objects, auto-detect the bank via a parser registry, export to Lunch Money CSV format, and trigger a browser download. Include comprehensive Vitest unit tests using `sample_input.csv` as the primary fixture.

This covers **4 modules and 2 test files** with significant domain-specific cleaning logic across 5 transaction code types (POS, MST, ICT, ITR) and 9 sub-types, plus PII stripping. The cleaning rules are documented in `specs/bank-parsing.md` and the raw column formats in `docs/dbs_formats.md` — both must be followed precisely.

### Files to create:
- `src/lib/parsers/types.ts` — `RawTransaction` and `BankParser` interfaces (from `docs/architecture.md`)
- `src/lib/parsers/dbs.ts` — DBS parser implementing `BankParser`, with per-code cleaning functions
- `src/lib/parsers/registry.ts` — `detectAndParse()` that auto-detects bank from CSV headers
- `src/lib/exporter/lunchmoney.ts` — CSV string generator + browser download trigger
- `tests/parsers/dbs.test.ts` — One test per transaction code + edge cases + failure cases
- `tests/exporter/lunchmoney.test.ts` — Export format validation tests

### Dependencies to install:
- `papaparse` (CSV parsing) + `@types/papaparse`

## EXAMPLES:

### TypeScript Interfaces (implement exactly as specified in `docs/architecture.md`)

```typescript
// src/lib/parsers/types.ts
interface RawTransaction {
  date: Date;
  description: string;          // Cleaned payee/merchant name
  originalDescription: string;  // Raw bank string (full Description column)
  amount: number;               // Negative = debit, positive = credit
  transactionCode: string;      // e.g. "POS", "MST", "ICT", "ITR"
  notes: string;                // Context like PayNow OTHR field
  originalPII: Record<string, string>; // Empty {} for Phase 1
}

interface BankParser {
  bankName: string;
  detect(csvContent: string): boolean;  // Match on CSV headers/structure
  parse(csvContent: string): RawTransaction[];
}
```

### Cleaning Rules — Input → Expected Output (from `sample_input.csv`)

**POS (NETS QR) — extract payee from Ref2, strip `TO: ` prefix:**
```
Ref1: "NETS QR PAYMENT 482711002345678"
Ref2: "TO: NOODLE HOUSE STALL"
→ payee: "Noodle House Stall", notes: ""
```

**MST (Card Payment) — extract merchant from Ref1 before acquirer suffix, ignore Ref2 (card) and Ref3 (DBS ref):**
```
Ref1: "BURGER KING (XYZ)       SI SGP 18FEB"   → payee: "Burger King (Xyz)"
Ref1: "BUS/MRT 799701767      SI SGP 14FEB"    → payee: "Bus/Mrt"  (strip numeric ref after merchant)
Ref1: "FastFood 123456       Si SGP 06FEB"     → payee: "Fastfood"  (strip numeric merchant ref)
Ref1: "VALUE MART GROCERIES      Si SGP 15FEB" → payee: "Value Mart Groceries"
```
⚠️ The acquirer suffix pattern is `<whitespace><CODE> <COUNTRY> <DDMMM>` (e.g. `SI SGP 18FEB`, `Si SGP 06FEB`). Note the mixed casing — use a case-insensitive regex. The numeric merchant ref (e.g. `799701767`, `123456`) sits between the merchant name and the acquirer suffix.

**ICT — Outgoing PayNow (Ref1 starts with `PayNow Transfer`):**
```
Ref1: "PayNow Transfer 5716588"
Ref2: "To: GOVERNMENT AGENCY OFFICE"  → payee: "Government Agency Office"
Ref3: "OTHR QR240219194137"           → notes: "QR240219194137"
```

**ICT — Incoming PayNow (Ref1 starts with `Incoming PayNow Ref`):**
```
Ref1: "Incoming PayNow Ref 9102384"
Ref2: "From: CHARLIE LIM"             → payee: "Charlie Lim"
Ref3: "OTHR Gong Xi Fa Cai"           → notes: "Gong Xi Fa Cai"
```

**ICT — Outgoing External Bank (Ref1 matches `<BANK>:<ACCOUNT>:I-BANK`):**
```
Ref1: "Trus:0142345678:I-BANK"        → payee: "Trus"
Ref2: "Transfer"                       → notes: "Transfer" (user input note, no OTHR prefix)
Ref3: "OTHR 17712569475193992000"      → (ignore, just a ref number)
```

**ITR — PayLah! Withdrawal (Ref1 starts with `SEND BACK FROM PAYLAH!`):**
```
Ref1: "SEND BACK FROM PAYLAH! :"
Ref2: "82765111"                       → (phone number — strip)
Ref3: "TF675051770762479939"           → (ref number — strip)
→ payee: "PayLah!", notes: "Received"
```

**ITR — PayLah! Top-Up (Ref1 starts with `TOP UP TO PAYLAH!`) — not in sample but must handle:**
```
→ payee: "PayLah!", notes: "Top-Up"
```

### ⚠️ Tricky Row in Sample Data (Row 38)
```
Description: "PayNow Transfer 9102384 To: CITY TAXI DRIVING SCHOOL OTHR M008488410010949564"
Ref2:        "To: COMFORTDELGRO       DRIVING CEN"
```
The Description and Ref2 don't match — DBS truncates long names in Ref2. **Always parse from Ref columns, not from Description.** The payee here should come from Ref2: `Comfortdelgro Driving Cen`.

### Export Format
```csv
date,payee,amount,category,notes
2026-02-23,Noodle House Stall,-9.30,,
2026-02-21,Burger King (Xyz),-28.45,,
2026-02-21,Alice Wong,200.00,,PayNow transfer
2026-02-13,Charlie Lim,255.00,,Gong Xi Fa Cai
2026-02-11,PayLah!,15.00,,Received
```
`category` is empty in Phase 1. Filename: `lunchprep-export-YYYY-MM-DD.csv`.

## DOCUMENTATION:

- `specs/bank-parsing.md` — **Primary spec**: cleaning rules per transaction code with expected transformations table
- `docs/dbs_formats.md` — **Raw format reference**: exact Ref1/Ref2/Ref3 column composition per sub-type
- `specs/output.md` — Lunch Money CSV format and constraints (max 3MB, 10K rows)
- `docs/architecture.md` — TypeScript interfaces (`RawTransaction`, `BankParser`), directory structure
- `src/lib/parsers/data/dbs_codes.json` — 928 DBS transaction codes → descriptions (use for `transactionCode` field)
- `sample_input.csv` — 42 real transactions covering POS, MST, ICT (PayNow in/out, external bank), ITR (PayLah!)
- [PapaParse docs](https://www.papaparse.com/docs) — Use `Papa.parse(csvString, { header: true, skipEmptyLines: true })`

## OTHER CONSIDERATIONS:

### CSV Structure Gotcha
DBS CSVs have 6 metadata rows before the actual headers on row 7. You **cannot** just pass the entire file to PapaParse with `header: true` — it will treat row 1 as the header. Either:
- Split the raw string by newlines, discard lines 1–6, rejoin, then parse, OR
- Parse without headers first, find the header row, then re-parse the data portion

### Parse from Ref Columns, Not Description
The `Description` column is just `Ref1 + ' ' + Ref2 + ' ' + Ref3` concatenated by DBS. It can be truncated or mismatched (see row 38 above). Always use the individual `Transaction Ref1`, `Transaction Ref2`, `Transaction Ref3` columns for cleaning logic. Store the raw `Description` in `originalDescription` for reference only.

### MST Merchant Ref Stripping is Tricky
Some MST merchants have a numeric reference embedded: `BUS/MRT 799701767`, `FastFood 123456`. These numbers are not part of the merchant name. But be careful — `BURGER KING (XYZ)` has no numeric ref, and names like `ABC1234` (row 29, a POS transaction) are legitimate merchant names. The numeric ref for MST specifically sits between the merchant name and the acquirer suffix (e.g. `SI SGP`) in Ref1. A reasonable approach: use a regex to match the acquirer suffix pattern first, then strip any trailing all-numeric token from what remains.

### Title-Casing Payees
All cleaned payees should be title-cased (e.g. `NOODLE HOUSE STALL` → `Noodle House Stall`). Be careful with:
- Abbreviations like `BUS/MRT` → `Bus/Mrt` (title-case each segment around `/`)
- Names with `PTE. LTD.` → preserve as title-case `Pte. Ltd.`
- Mixed input: `COMFORTDELGRO       DRIVING CEN` — collapse whitespace first, then title-case

### Amount Handling
- DBS has separate `Debit Amount` and `Credit Amount` columns — exactly one is populated per row
- Debit → negative, Credit → positive
- Round to 2 decimal places: `Math.round(amount * 100) / 100`
- Empty amount fields parse as `NaN` or `""` — handle gracefully

### PII Stripping
Strip from ALL output fields (payee, notes):
- Card numbers: `\d{4}-\d{4}-\d{4}-\d{4}`
- Phone numbers in Ref2 for ITR PayLah! rows (8-digit Singapore phone numbers)
- Long alphanumeric reference strings (e.g. `TF675051770762479939`, `436289698411111`)
- Acquirer/country/date suffixes are already stripped during MST cleaning

### Phase 1 Boundaries
- `category` column in export must be **empty** (AI categorisation is Phase 2)
- `originalPII` should be `{}` — PII substitution/restoration is Phase 2
- No UI beyond what already exists — this is pure backend/library code + tests
- Do NOT modify any existing files in `docs/`, `specs/`, or `src/lib/parsers/data/`
