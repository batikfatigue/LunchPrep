# Anonymisation Strategy — Brainstorming & Ideation

> **Status**: Draft — brainstorming document, not a finalised spec.
>
> **Goal**: Improve anonymisation accuracy while maintaining privacy-first principles.

## Problem Statement

The current anonymisation approach uses a **negative gate** — a hardcoded list of business keywords (e.g. `PTE LTD`, `CAFE`, `SERVICES`) to exclude merchants from anonymisation. Everything else across all transaction types is assumed to be a personal name and gets masked.

### Failure modes

| Type | Description | Example | Impact |
|------|-------------|---------|--------|
| **False positive** (over-anonymisation) | Merchant doesn't match any keyword → gets masked | Hawker stall `"ECLIPSE"` via PayNow | Gemini loses payee context, miscategorises as "Transfers" |
| **False negative** (PII leak) | Personal name contains a keyword → bypasses masking | Person named `"LEE GROUP"` | Real name sent to Gemini |

The keyword list is fundamentally unexhaustive. The more keywords added, the more collision risk with personal names.

### Why this matters

- **Privacy violations** (false negatives) are unacceptable — the PRD mandates privacy-first.
- **Categorisation degradation** (false positives) undermines the core value prop — accurate AI categorisation with minimal manual effort.

---

## Current Architecture

The current logic does **not** differentiate by transaction type. All transactions go through the same keyword gate:

```
payee → business keyword match? → yes → skip (send real name)
                                → no  → anonymise (send mock name)
```

This means even non-P2P transactions (POS, MST, UMC) — which are always merchants — get run through the keyword check. If a merchant name doesn't match a keyword, it gets unnecessarily anonymised.

---

## Proposed Approach: Progressive Unmasking

**Default state**: All P2P payees start masked. The pipeline's job is to **recover merchants** with increasing confidence. A failure at any level keeps the payee masked — the safe default.

Non-P2P transactions (POS, MST, UMC, etc.) bypass the pipeline entirely — they are always merchants.

### Pre-filter: Deterministic Redaction

Before any classification, regex-redact structured financial identifiers that should never reach an external API:

- Credit card numbers (4×4 digit groups, usually delimited by dashes e.g. `1234-5678-9012-3456`)
- Bank account numbers
- NRIC/FIN patterns (`S/T/F/G` + 7 digits + letter)
- Phone numbers — 8-digit local patterns (e.g. `91234567`); if prefixed with `+65`, the following 8 digits are almost certainly a phone number, but the prefix is not always present
- Random alphanumeric strings (bill references, transaction IDs, QR code IDs like `qsb-sqr-sg-312515312312` or `M008488012930410564`) — these are financial identifiers and not meaningful for categorisation

This is a hard redaction layer, independent of the classification pipeline.

### Level 1: Notes-Based AI Classification

P2P transactions often carry a `notes` field — user-typed text or a bill/payment reference number. **Notes contain no PII**, so they're safe to send to Gemini as the first recovery step.

Send `notes` + `transactionType` to Gemini and ask:

1. **Are the notes meaningful?** (e.g. `"birthday dinner"`, `"rent aug"`)
   → Gemini can categorise from notes alone. Payee stays masked. Done.
2. **Do the notes contain a reference number?** (e.g. `"INV-2024-001"`, `"M008488012930410564"`)
   → Likely a merchant bill payment. Proceed to Level 2 to verify before unmasking.
3. **Notes are empty or uninformative.**
   → No signal. Payee stays masked (safe default).

Note: The reference numbers in notes are opaque bill/payment references, not actual UEN identifiers. Their presence is a heuristic signal (personal P2P transfers don't typically have bill references), not a definitive merchant match.

### Level 2: Syntax Heuristics on Payee Field

For cases flagged as "likely merchant" by Level 1, apply syntax heuristics to the payee string before unmasking. This acts as a safety net — even if Gemini says it's a merchant, we still verify locally.

Two sub-strategies (not mutually exclusive):

#### 2.1: Positive gate — detect business patterns

Match payee against known business identifiers:
- Legal suffixes: `PTE LTD`, `SDN BHD`, `LLC`, `INC`, `CORP`
- Business terms: `ENTERPRISE`, `HOLDINGS`, `SERVICES`
- Venue types: `CAFE`, `RESTAURANT`, `CLINIC`, `PHARMACY`

**Tradeoff**: High precision (if it matches, it's almost certainly a business), but low recall (many merchants won't match — `"GRAB"`, `"ECLIPSE"`, `"KOPITIAM"`).

#### 2.2: Negative gate — detect personal name patterns

Match payee against personal name structures common in Singapore:
- Chinese names: 2–3 capitalised words (`TAN WEI MING`)
- Malay names: `BIN` / `BINTE` particles (`AHMAD BIN RASHID`)
- Indian names: `S/O` / `D/O` particles (`PRIYA D/O KUMAR`)
- General: 2–3 alphabetic words, no numbers, no punctuation

**Tradeoff**: Higher recall for businesses (anything that doesn't look like a name passes through), but risks leaking unusual personal names.

#### Combined approach

Run both gates. If 2.1 matches → unmask. If 2.2 matches → keep masked. Conflicts (matches both or neither) → keep masked (privacy-safe default).

### Level 3: Lightweight Local NER (Future Consideration)

For remaining ambiguous cases, a browser-based Named Entity Recognition model (e.g. via `@xenova/transformers` / ONNX runtime) could classify payee text as `PERSON` vs `ORG` locally.

- **Pros**: Most accurate classification, fully local (no PII exposure).
- **Cons**: ~50–100MB model download, cold-start latency, significant engineering cost.
- **Recommendation**: Defer unless Levels 1–2 prove insufficient in practice. Measure misclassification rates first.

### Level 4: User Verification (Existing)

The current whitelist mechanism in `localStorage` — users flag incorrectly anonymised merchants in the review table. These decisions persist across sessions.

This is the final safety net and already exists. No change needed, but it becomes less critical if upstream levels improve accuracy.

---

## Proposed Flow Diagram

```
Transaction
│
├── Non-P2P (POS/MST/UMC) ──────────────────────── Send payee to Gemini (always merchant)
│
└── P2P (ICT/ITR)
    │
    ├── Pre-filter: Regex-redact financial identifiers
    │
    ├── Default: Payee is masked
    │
    ├── Level 1: Send NOTES to Gemini
    │   ├── Meaningful notes ──────────────────────── Categorise from notes alone (payee stays masked)
    │   ├── Reference number ──────────────────────── Likely merchant → Level 2
    │   └── Empty / uninformative ─────────────────── Keep masked (safe default)
    │
    ├── Level 2: Syntax heuristics on payee
    │   ├── Matches business pattern (2.1) ────────── Unmask → send payee to Gemini
    │   ├── Matches personal name pattern (2.2) ───── Keep masked
    │   └── Ambiguous ─────────────────────────────── Keep masked (safe default)
    │
    ├── [Level 3: Local NER — future, if needed]
    │
    └── Level 4: User whitelist override (existing)
```

---

## Recommendations

1. **Start with Levels 1–2 + 4.** This covers the majority of cases without heavy engineering. Level 3 (local NER) should only be pursued if measurable misclassification rates warrant the complexity.

2. **Merge the notes classification with the existing categorisation API call** if possible. Sending two separate Gemini calls (one for notes classification, one for categorisation) doubles API cost. Consider a single prompt that handles both: *"Given these notes, can you categorise this transaction? If not, is this likely a merchant or personal transfer?"*

3. **Measure before optimising.** Before building Levels 2–3, run the current transaction dataset through Level 1 alone and measure how many cases fall through to "ambiguous". If it's a small percentage, simpler heuristics at Level 2 may be sufficient.

4. **Default to privacy.** At every decision point, the fallback should be "keep masked". Miscategorisation is recoverable (user edits the category). PII exposure is not.

---

## Open Questions

- [ ] What percentage of P2P transactions have non-empty, meaningful notes?
- [ ] How often are merchants paid via PayNow in the target user base?
- [ ] Can the notes classification be merged into a single Gemini call with categorisation?
- [ ] Is the `@xenova/transformers` bundle size acceptable for this app's target audience?
- [ ] Should Level 2 use 2.1, 2.2, or both combined?
