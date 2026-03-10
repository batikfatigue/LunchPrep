## Why

The DBS parser cleaners currently use loose sub-type detection (prefix checks like `startsWith`) without validating that the full reference field structure matches the known format. This means unknown or changed formats silently flow through cleaning logic designed for a specific layout, risking incorrect payee/notes extraction and PII leakage (e.g. raw account numbers, phone numbers, or reference strings surfacing as the payee). Adding strict full-pattern validation ensures cleaners only process data they genuinely understand, and a single catch-all fallback safely handles everything else.

## What Changes

- Each per-code cleaner (`cleanPOS`, `cleanMST`, `cleanICT`, `cleanITR`) gains full regex-based format validation against the known patterns documented in `docs/dbs_formats.md`. If any ref field doesn't match the expected structure, the cleaner returns `null`.
- Cleaner return type changes from `CleanedFields` to `CleanedFields | null`.
- A single catch-all fallback in the `parse()` caller replaces all per-cleaner and per-code default handling: any `null` result (from known codes with unrecognised formats, or completely unknown codes) maps to `{ payee: "Unknown Format", notes: "" }`.
- The existing `default` switch branch (which currently title-cases the raw description) is replaced by the same catch-all, preventing PII leakage from unknown transaction codes.

## Capabilities

### New Capabilities
- `format-validation`: Strict regex-based format validation for DBS transaction reference fields, ensuring cleaners only process recognised patterns.

### Modified Capabilities

_(none — this is an implementation-level hardening of existing parsing behaviour; no spec-level requirement changes)_

## Impact

- **Code**: `src/lib/parsers/dbs.ts` — all four cleaner functions and the `parse()` switch/caller logic.
- **Tests**: Existing DBS parser tests need updating; new tests for format rejection and catch-all fallback behaviour.
- **Downstream**: Transactions with unrecognised formats will now surface as "Unknown Format" instead of a (potentially PII-containing) title-cased description. This is intentional — it trades completeness for safety until `stripPII` is improved.
