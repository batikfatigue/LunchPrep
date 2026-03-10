## Context

The DBS parser in `src/lib/parsers/dbs.ts` has four per-code cleaner functions (`cleanPOS`, `cleanMST`, `cleanICT`, `cleanITR`) that extract payee and notes from raw CSV reference fields. Currently these cleaners use loose sub-type detection — prefix checks like `startsWith("PayNow Transfer")` or regex on one field — without validating that **all** reference fields match the full known format documented in `docs/dbs_formats.md`. This means an unknown or changed format can slip through cleaning logic and produce incorrect output or leak PII (account numbers, phone numbers, reference strings) into user-facing fields.

The `stripPII` function provides a second line of defence but is pattern-based and not comprehensive enough to catch all PII in arbitrary unknown formats. A defence-in-depth approach is needed: validate first, then clean only what we understand.

## Goals / Non-Goals

**Goals:**
- Each cleaner validates all relevant ref fields against the full known pattern before processing.
- Cleaners return `null` when the format is unrecognised — they never guess.
- A single catch-all at the caller level handles all `null` results uniformly: `{ payee: "Unknown Format", notes: "" }`.
- Unknown transaction codes also hit the same catch-all (replacing the current `titleCase(description)` default).
- Prevent PII leakage from unrecognised formats.

**Non-Goals:**
- Improving `stripPII` (future work — this change is the interim safety net).
- Logging, warning, or reporting unrecognised formats (no telemetry yet).
- Changing the output schema or downstream pipeline behaviour.
- Handling new DBS format discovery (that's a separate future task of adding new patterns).

## Decisions

### 1. Cleaners return `CleanedFields | null`

Each cleaner returns `null` when its input doesn't match any known sub-type pattern. The caller uses nullish coalescing (`??`) against a single catch-all value.

**Why not throw?** Unrecognised formats are expected (DBS changes formats, new codes appear). Throwing would abort the entire parse. Silent `null` + catch-all keeps the pipeline running.

**Why not per-cleaner fallback?** The fallback behaviour ("Unknown Format") is the same regardless of which cleaner rejected it. Centralising it in the caller avoids duplication and makes the policy easy to change later.

### 2. Full regex validation, not just prefix detection

Each sub-type match uses a regex that validates the **complete structure** of the relevant ref fields — not just whether ref1 starts with a certain prefix. For example, ICT PayNow outgoing validates:
- ref1 matches `^PayNow Transfer \S+$`
- ref2 matches `^To: .+$` (case-insensitive)
- ref3 matches `^OTHR .+$` (case-insensitive)

All three must pass before the cleaner processes the transaction.

**Why full validation?** A prefix-only check lets through malformed data where later fields don't match expectations. The cleaning logic assumes a specific structure — if that structure isn't there, the extraction is wrong.

### 3. Catch-all discards all transaction details

The catch-all produces `{ payee: "Unknown Format", notes: "" }`. No raw field data is surfaced. This is deliberately conservative — it trades completeness for safety.

**Alternative considered:** Title-casing the description (current behaviour). Rejected because the description is `Ref1 + Ref2 + Ref3` concatenated and may contain PII.

### 4. Validation patterns are inline regex constants

Format patterns are defined as regex constants within each cleaner function (or at module scope). They are not externalised into a separate config file.

**Why?** The patterns are tightly coupled to the cleaning logic — each regex corresponds to a specific extraction strategy. Separating them adds indirection without benefit since any format change requires updating both the pattern and the extraction code.

## Risks / Trade-offs

- **[More transactions show "Unknown Format"]** → Expected initially. As format coverage grows (adding new patterns), this decreases. Users see safe but less informative output rather than potentially wrong or PII-leaking output.
- **[Regex maintenance burden]** → Each new DBS format requires adding a pattern. Mitigated by clear documentation in `dbs_formats.md` and test cases per pattern.
- **[Over-strict rejection of valid formats]** → A too-tight regex could reject valid variations (e.g. extra whitespace). Mitigated by using tolerant patterns (e.g. `\s+` instead of single space) and thorough test coverage with real transaction samples.
