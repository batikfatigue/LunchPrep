# Project Roadmap & Checklist

## Phase 1: Foundation 🏗️

**Project Setup**
- [x] Initialise Next.js 16 project with TypeScript (`create-next-app`)
- [x] Install and configure Tailwind CSS 4
- [x] Install and configure shadcn/ui
- [x] Set up Vitest for unit testing
- [x] Create `.env.local` template with `GEMINI_API_KEY`, `GEMINI_MODEL`, `RATE_LIMIT_RPM`
- [x] Configure base layout (`layout.tsx`) and shell structure

**Parser: Core**
- [x] Define `RawTransaction` and `BankParser` TypeScript interfaces (`src/lib/parsers/types.ts`)
- [x] Implement parser registry with `detectAndParse()` (`src/lib/parsers/registry.ts`)

**Parser: DBS**
- [x] Skip header rows 1–6; parse column headers on row 7
- [x] Parse `Transaction Date` (`23 Feb 2026` → `2026-02-23`)
- [x] Parse `Debit Amount` / `Credit Amount` into signed float, rounded to 2 d.p.
- [x] Clean `POS` transactions: strip `NETS QR PAYMENT <ref> TO:`, extract merchant name
- [x] Clean `MST` transactions: extract name before `SI SGP`, strip card number and trailing ref
- [x] Clean `ICT` transactions: extract `From:`/`To:` name, extract `OTHR` field as notes
- [x] Clean `ITR` transactions: label as `PayLah!`, strip phone number and transaction ref
- [x] Strip residual PII: card number pattern `\d{4}-\d{4}-\d{4}-\d{4}`, numeric reference codes

**Export**
- [x] Generate Lunch Money CSV string from `RawTransaction[]` (`src/lib/exporter/lunchmoney.ts`)
- [x] Trigger browser file download with filename `lunchprep-export-YYYY-MM-DD.csv`

**Tests**
- [x] Unit tests for DBS parser (one test case per transaction code + edge cases)
- [x] Unit tests for Lunch Money CSV exporter (correct columns, signs, date format)

---

## Phase 2: AI Integration 🤖

**Anonymisation**
- [x] Detect personal names in ICT `From:`/`To:` and ITR fields
- [x] Build placeholder map `{ "Person A": "REAL NAME" }` in client memory
- [x] Replace names with placeholders before API call; restore in final output

**Gemini Proxy**
- [x] Implement `POST /api/categorise` route (`src/app/api/categorise/route.ts`)
- [x] Add IP-based rate limiting (default: 10 RPM)
- [x] Build Gemini prompt with transaction list + category enum (`src/lib/categoriser/prompt.ts`)
- [x] Configure Gemini: `gemini-2.5-flash-lite`, temperature `0.0`, structured JSON output
- [x] Validate and parse Gemini response; return `{ results: [{ index, category }] }`

**UI**
- [x] Define default category list (`src/lib/categoriser/categories.ts`)
- [x] Add category dropdown column to transaction review table
- [x] Show loading spinner during API call
- [x] Show error state with manual categorisation fallback if API call fails

**Tests**
- [x] Unit tests for name anonymiser (detection, mapping, restoration)
- [x] Unit tests for prompt builder (correct format, category injection)

---

## Phase 3: Customisation & UI 💄

**Categories**
- [x] Category management UI: add, remove, reorder categories
- [x] Persist custom categories to `localStorage`
- [x] Load categories from `localStorage` on startup; fall back to defaults

**BYOK**
- [x] API key input component (`src/components/api-key-input.tsx`)
- [x] Store user key in `localStorage`; show active key mode indicator
- [x] Route categorise calls directly from browser to Gemini when BYOK key is set

**UI Polish**
- [x] File upload component with drag-and-drop and file picker (`src/components/file-upload.tsx`)
- [x] Transaction review table with inline edit (payee, notes, category) (`src/components/transaction-table.tsx`)
- [x] Debit/credit colour coding (red/green)
- [x] Pipeline step indicator: Upload → Review → Export (`src/components/pipeline-steps.tsx`)
- [x] Summary row: total debits, total credits, net

---

## Phase 4: Deployment 🚀

- [x] Configure Vercel deployment; set environment variables in dashboard
- [x] Write `Dockerfile` using `node:20-alpine` with Next.js standalone mode
- [x] Write landing page section explaining the tool (above the upload UI)
- [x] Add `README.md` with self-hosting instructions (`docker run` command)
- [x] Open-source repository setup: `LICENSE` (MIT), `CONTRIBUTING.md`

---

## Discovered During Work

**Bug Fixes**
- [x] Fix BYOK key serialisation mismatch: `getBYOKKey`/`setBYOKKey` used raw strings while `useLocalStorage` used JSON — caused server proxy to never be reached (JSON-serialised empty string `'""'` was truthy)

---

## Success Criteria (MVP)
- [ ] Upload DBS CSV → download valid Lunch Money CSV
- [ ] AI categorisation accuracy > 80% on common merchants
- [ ] No financial data logged or stored server-side
- [ ] Full pipeline completes in < 2 minutes
