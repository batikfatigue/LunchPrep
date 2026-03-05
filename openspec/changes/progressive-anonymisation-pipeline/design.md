## Context

The current anonymiser (`src/lib/anonymiser/pii.ts`) runs a single-pass keyword gate across all transactions: if the payee matches a business keyword, it passes through unmasked; otherwise it gets anonymised with a mock name. This applies indiscriminately to all transaction types — even POS/MST/UMC (which are always merchants) get checked.

The `anonymise()` → `callCategorise()` → `restore()` pipeline in `page.tsx` is well-structured and non-mutating. The `RawTransaction` type already carries the necessary fields (`notes`, `transactionCode`, `originalPII`). The existing whitelist infrastructure (`loadWhitelist`, `addToWhitelist`) is implemented but not yet wired to UI.

Reference: `docs/anonymisation-strategy.md` contains the full brainstorming document with the progressive unmasking approach agreed upon.

## Goals / Non-Goals

**Goals:**
- Eliminate false negatives (PII leaks) by defaulting all P2P payees to masked
- Recover merchant names from the masked pool using safe signals (notes field, syntax patterns)
- Add a hard redaction layer for structured financial identifiers (credit cards, NRIC, phone numbers, etc.)
- Scope anonymisation to P2P transaction types only — non-P2P types bypass entirely
- Maintain the existing non-mutating `anonymise()` → `restore()` contract

**Non-Goals:**
- Local NER model (Level 3 in strategy doc) — deferred until Levels 1–2 are measured
- Whitelist UI — existing infrastructure is sufficient, UI is a separate change
- Changes to the Gemini categorisation prompt or model config
- Supporting banks other than DBS

## Decisions

### 1. Channel-aware entry gate instead of keyword gate

**Decision:** Replace `isTransferTransaction()` + `isBusinessName()` with a channel filter. Non-P2P codes pass through unmasked. P2P codes (ICT, ITR, ATR, TRF, TTR, OTRF) default to masked.

**Rationale:** The current keyword gate runs on all transactions and is the root cause of both false positives (merchants masked) and false negatives (names leaked). Channel filtering is deterministic and zero-risk — POS/MST/UMC are always merchants by definition.

**Alternative considered:** Keep keywords as a fast-path for obvious businesses (e.g. `PTE LTD`) before masking. Rejected because it reintroduces the same class of keyword collision risk, and the recovery pipeline (Levels 1–2) handles these cases anyway.

### 2. Pre-filter as a separate, independent redaction layer

**Decision:** Implement regex-based redaction of structured financial identifiers (credit cards, NRIC/FIN, phone numbers, alphanumeric reference strings) as a standalone function that runs on all transactions before any other processing.

**Rationale:** These identifiers should never reach an external API regardless of transaction type. Separating this from the anonymisation pipeline makes it composable and independently testable. It protects against identifiers appearing in unexpected fields (e.g. a credit card number in the `notes` field).

**Alternative considered:** Embed redaction logic within `anonymise()`. Rejected because redaction applies to ALL transactions (not just P2P) and to multiple fields (not just `description`).

### 3. Notes-only Gemini call for merchant classification (Level 1)

**Decision:** For masked P2P transactions, send only `notes` + `transactionType` to Gemini to classify whether the transaction can be categorised from notes alone, or if the notes suggest a merchant payment.

**Rationale:** The `notes` field contains no PII — it holds user-typed text or system-generated reference numbers. Gemini can determine from notes alone whether a transaction is a merchant bill payment (reference number present) or a personal transfer with context (e.g. "birthday dinner"). This is the only safe way to leverage AI intelligence without exposing the payee name.

**Implementation approach:** Merge the notes classification into the existing categorisation API call rather than adding a separate endpoint. The prompt can ask Gemini to both classify the notes AND categorise when possible, in a single request. Transactions with meaningful notes get categorised immediately; transactions flagged as likely-merchant proceed to Level 2; transactions with empty/uninformative notes stay masked and get categorised as-is.

**Alternative considered:** Separate API endpoint for notes classification. Rejected because it doubles API cost and latency for every P2P transaction.

### 4. Syntax heuristics as a local safety net (Level 2)

**Decision:** For P2P transactions flagged as "likely merchant" by Level 1, apply local pattern matching before unmasking: positive gate (business name patterns) and negative gate (personal name patterns). Conflicts default to masked.

**Rationale:** Even when Gemini says notes suggest a merchant, we verify locally before exposing the payee. This provides a defense-in-depth layer. The heuristics here are narrower than the current keyword list — focused on high-precision signals (legal suffixes like `PTE LTD`) and personal name structures (Malay `BIN`/`BINTE`, Indian `S/O`/`D/O`).

**Alternative considered:** Trust Gemini's classification without local verification. Rejected because Gemini could hallucinate or misclassify reference numbers, and the local check is cheap.

### 5. Expand P2P transaction code set

**Decision:** Expand the transfer code set from just ICT/ITR to include ATR, TRF, TTR, OTRF (all map to "Funds Transfer" in `dbs_codes.json`).

**Rationale:** These codes all carry the same description and represent the same payment channel. Omitting them means some fund transfers bypass anonymisation entirely.

**Alternative considered:** Include remittance codes (INW, ITT, OTT, REM, RTF). Deferred — these are less common for casual P2P and can be added later based on user data.

## Risks / Trade-offs

**[Risk] Notes field is often empty** → Many P2P transactions may have no notes, meaning Level 1 provides no signal and the payee stays masked. This is acceptable (privacy-safe default) but could reduce categorisation accuracy for merchant PayNow payments with no context.
→ **Mitigation:** Level 2 syntax heuristics can still recover obvious merchants (those with `PTE LTD`, etc.). User whitelist (Level 4) handles the rest. Measure the empty-notes rate against real data before investing in Level 3 (NER).

**[Risk] Merged notes classification adds prompt complexity** → Asking Gemini to both classify notes AND categorise in a single call makes the prompt more complex and may reduce accuracy.
→ **Mitigation:** Use structured JSON output with explicit fields for both classification result and category. Test prompt against real transaction data before shipping.

**[Risk] Two-phase categorisation changes the API contract** → The current `callCategorise()` sends all transactions in one batch. The new flow may need two batches (notes-only for P2P, then full with recovered merchants).
→ **Mitigation:** Keep the external API contract unchanged. Handle the two-phase logic client-side in `page.tsx` / `client.ts` — split transactions into batches, merge results.

**[Risk] Alphanumeric reference redaction could be too aggressive** → Regex for "random alphanumeric strings" may strip meaningful merchant identifiers or transaction context.
→ **Mitigation:** Only redact strings that match specific patterns (consecutive digits/alphanumeric > N characters, common reference formats). Preserve short strings and natural language words.

## Open Questions

- What is the exact threshold/pattern for "random alphanumeric string" redaction? Needs a concrete regex definition.
- Should the notes classification result be persisted on the `RawTransaction` object (e.g. a new `notesClassification` field) or kept as transient pipeline state?
- How should the two-phase flow interact with BYOK mode? BYOK calls go directly to Gemini from the browser — the notes classification call would also need to be direct.
