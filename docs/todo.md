# Project Roadmap & Checklist

## Phase 1: Foundation 🏗️

**Project Setup**
- [ ] Initialise Next.js 15 project with TypeScript (`create-next-app`)
- [ ] Install and configure Tailwind CSS 4
- [ ] Install and configure shadcn/ui
- [ ] Set up Vitest for unit testing
- [ ] Create `.env.local` template with `GEMINI_API_KEY`, `GEMINI_MODEL`, `RATE_LIMIT_RPM`
- [ ] Configure base layout (`layout.tsx`) and shell structure

**Parser: Core**
- [ ] Define `RawTransaction` and `BankParser` TypeScript interfaces (`src/lib/parsers/types.ts`)
- [ ] Implement parser registry with `detectAndParse()` (`src/lib/parsers/registry.ts`)

**Parser: DBS**
- [ ] Skip header rows 1–6; parse column headers on row 7
- [ ] Parse `Transaction Date` (`23 Feb 2026` → `2026-02-23`)
- [ ] Parse `Debit Amount` / `Credit Amount` into signed float, rounded to 2 d.p.
- [ ] Clean `POS` transactions: strip `NETS QR PAYMENT <ref> TO:`, extract merchant name
- [ ] Clean `MST` transactions: extract name before `SI SGP`, strip card number and trailing ref
- [ ] Clean `ICT` transactions: extract `From:`/`To:` name, extract `OTHR` field as notes
- [ ] Clean `ITR` transactions: label as `PayLah!`, strip phone number and transaction ref
- [ ] Strip residual PII: card number pattern `\d{4}-\d{4}-\d{4}-\d{4}`, numeric reference codes

**Export**
- [ ] Generate Lunch Money CSV string from `RawTransaction[]` (`src/lib/exporter/lunchmoney.ts`)
- [ ] Trigger browser file download with filename `lunchprep-export-YYYY-MM-DD.csv`

**Tests**
- [ ] Unit tests for DBS parser (one test case per transaction code + edge cases)
- [ ] Unit tests for Lunch Money CSV exporter (correct columns, signs, date format)

---

## Phase 2: AI Integration 🤖

**Anonymisation**
- [ ] Detect personal names in ICT `From:`/`To:` and ITR fields
- [ ] Build placeholder map `{ "Person A": "REAL NAME" }` in client memory
- [ ] Replace names with placeholders before API call; restore in final output

**Gemini Proxy**
- [ ] Implement `POST /api/categorise` route (`src/app/api/categorise/route.ts`)
- [ ] Add IP-based rate limiting (default: 10 RPM)
- [ ] Build Gemini prompt with transaction list + category enum (`src/lib/categoriser/prompt.ts`)
- [ ] Configure Gemini: `gemini-2.5-flash-lite`, temperature `0.0`, structured JSON output
- [ ] Validate and parse Gemini response; return `{ results: [{ index, category }] }`

**UI**
- [ ] Define default category list (`src/lib/categoriser/categories.ts`)
- [ ] Add category dropdown column to transaction review table
- [ ] Show loading spinner during API call
- [ ] Show error state with manual categorisation fallback if API call fails

**Tests**
- [ ] Unit tests for name anonymiser (detection, mapping, restoration)
- [ ] Unit tests for prompt builder (correct format, category injection)

---

## Phase 3: Customisation & UI 💄

**Categories**
- [ ] Category management UI: add, remove, reorder categories
- [ ] Persist custom categories to `localStorage`
- [ ] Load categories from `localStorage` on startup; fall back to defaults

**BYOK**
- [ ] API key input component (`src/components/api-key-input.tsx`)
- [ ] Store user key in `localStorage`; show active key mode indicator
- [ ] Route categorise calls directly from browser to Gemini when BYOK key is set

**UI Polish**
- [ ] File upload component with drag-and-drop and file picker (`src/components/file-upload.tsx`)
- [ ] Transaction review table with inline edit (payee, notes, category) (`src/components/transaction-table.tsx`)
- [ ] Debit/credit colour coding (red/green)
- [ ] Pipeline step indicator: Upload → Review → Export (`src/components/pipeline-steps.tsx`)
- [ ] Summary row: total debits, total credits, net

---

## Phase 4: Deployment 🚀

- [ ] Configure Vercel deployment; set environment variables in dashboard
- [ ] Write `Dockerfile` using `node:20-alpine` with `@sveltejs/adapter-node` (or Next.js standalone mode)
- [ ] Write landing page section explaining the tool (above the upload UI)
- [ ] Add `README.md` with self-hosting instructions (`docker run` command)
- [ ] Open-source repository setup: `LICENSE` (MIT), `CONTRIBUTING.md`

---

## Success Criteria (MVP)
- [ ] Upload DBS CSV → download valid Lunch Money CSV
- [ ] AI categorisation accuracy > 80% on common merchants
- [ ] No financial data logged or stored server-side
- [ ] Full pipeline completes in < 2 minutes
