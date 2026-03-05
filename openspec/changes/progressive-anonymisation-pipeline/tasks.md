## 1. Pre-filter: Deterministic Redaction

- [ ] 1.1 Create `src/lib/anonymiser/redact.ts` with regex patterns for credit cards (4×4 dash-delimited), bank accounts (10+ consecutive digits), NRIC/FIN (`S/T/F/G` + 7 digits + letter), phone numbers (8-digit local, optional `+65` prefix), and alphanumeric reference strings
- [ ] 1.2 Export a `redactFinancialIdentifiers(text: string): string` function that replaces all matches with `[REDACTED]`
- [ ] 1.3 Export a `redactTransaction(tx: RawTransaction): RawTransaction` function that applies redaction to both `description` and `notes` fields (non-mutating)
- [ ] 1.4 Write tests in `tests/anonymiser/redact.test.ts` covering each pattern type, short strings preserved, and multi-match scenarios

## 2. Channel-Aware Transaction Classification

- [ ] 2.1 Expand `TRANSFER_TRANSACTION_CODES` set in `pii.ts` to include full descriptions for ATR, TRF, TTR, OTRF (all "Funds Transfer")
- [ ] 2.2 Rename `isTransferTransaction()` to `isP2PTransaction()` for clarity
- [ ] 2.3 Update all call sites referencing the old function name
- [ ] 2.4 Update tests in `tests/anonymiser/pii.test.ts` for expanded code set and renamed function

## 3. Default-Masked P2P Pipeline

- [ ] 3.1 Rewrite `anonymise()` to remove the `isBusinessName()` keyword gate — all P2P transactions default to masked with mock names
- [ ] 3.2 Remove `BUSINESS_KEYWORDS` constant and `isBusinessName()` function
- [ ] 3.3 Update `anonymise()` to skip non-P2P transactions entirely (no keyword check, no mock name assignment)
- [ ] 3.4 Integrate `redactTransaction()` call at the start of `anonymise()` before any masking logic
- [ ] 3.5 Update existing tests to reflect blind-mask behaviour (remove keyword gate test cases, add channel filter test cases)

## 4. Level 1: Notes-Based AI Classification

- [ ] 4.1 Create `src/lib/categoriser/notes-classifier.ts` with a function that builds a notes-only classification prompt (notes + transactionType, no payee)
- [ ] 4.2 Define the Gemini response schema for notes classification: `{ index: number, classification: "meaningful" | "reference" | "uninformative", category?: string }`
- [ ] 4.3 Add a notes classification system instruction to `src/lib/categoriser/prompt.ts`
- [ ] 4.4 Add a `classifyNotes()` function in `src/lib/categoriser/client.ts` that calls Gemini with notes-only payload (supports both proxy and BYOK modes)
- [ ] 4.5 Write tests for the notes classifier prompt building and response parsing

## 5. Level 2: Syntax Heuristics for Merchant Recovery

- [ ] 5.1 Create `src/lib/anonymiser/heuristics.ts` with `matchesBusinessPattern(name: string): boolean` (positive gate — legal suffixes, business terms, venue types)
- [ ] 5.2 Add `matchesPersonalNamePattern(name: string): boolean` (negative gate — BIN/BINTE, S/O/D/O particles, 2–3 alphabetic word structure)
- [ ] 5.3 Add `shouldUnmask(name: string): boolean` implementing combined conflict resolution (positive match + no negative match → unmask, all other cases → keep masked)
- [ ] 5.4 Write tests covering business suffix match, personal name particle match, ambiguous names, and conflict cases

## 6. Pipeline Integration

- [ ] 6.1 Update `triggerCategorise()` in `page.tsx` to split transactions into non-P2P (send directly) and P2P (enter pipeline)
- [ ] 6.2 For P2P batch: call `classifyNotes()` first, then apply Level 2 heuristics on "reference" results to decide which payees to unmask
- [ ] 6.3 Merge non-P2P results, notes-categorised results, and unmasked-merchant results into a single batch for the final Gemini categorisation call
- [ ] 6.4 Ensure `restore()` still works correctly with the mixed batch (masked transactions have `originalPII`, unmasked ones don't)
- [ ] 6.5 Update `callCategorise()` in `client.ts` if the request shape needs adjustment for the two-phase flow

## 7. API Route Updates

- [ ] 7.1 Add a notes-classification mode to `POST /api/categorise` (or create a new `POST /api/classify-notes` endpoint) that accepts notes-only payloads
- [ ] 7.2 Ensure rate limiting applies to the notes classification call as well
- [ ] 7.3 Write integration tests for the new API mode/endpoint

## 8. Cleanup and Documentation

- [ ] 8.1 Remove dead code: `BUSINESS_KEYWORDS`, `isBusinessName()`, `WHITELIST_STORAGE_KEY` references that are no longer used in the main pipeline
- [ ] 8.2 Update `specs/ai-categorisation.md` to reflect the new pipeline architecture
- [ ] 8.3 Update `docs/anonymisation-strategy.md` status from "Draft" to reference the implementation
- [ ] 8.4 Mark completed tasks in `docs/todo.md`
