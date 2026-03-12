## 1. Purpose Code Resolution Helper

- [x] 1.1 Add `resolvePurposeCode(code: string): string | null` helper in `src/lib/parsers/dbs.ts` — hardcode `INT` → "Intra Company Payment", suppress `OTHR` → null, lookup `fast_purpose_codes.json`, warn + null on unknown
- [x] 1.2 Add unit tests for `resolvePurposeCode`: known code (SALA), OTHR suppression, INT exception, unknown code warning

## 2. Update cleanICT Outgoing Interbank Branch

- [x] 2.1 Replace the `OTHR` prefix validation in cleanICT with `/^(INT|[A-Z]{4})\s/i` pattern check on ref3
- [x] 2.2 Extract purpose code (first token of ref3) and resolve via `resolvePurposeCode`
- [x] 2.3 Build notes by combining resolved purpose label and ref2 notes in pipe-delimited format
- [x] 2.4 Update existing cleanICT outgoing interbank tests to use purpose code ref3 format instead of `OTHR <REF>`
- [x] 2.5 Add tests for notes consolidation: both present, purpose only, notes only, neither

## 3. Spec Updates

- [x] 3.1 Update `specs/bank-parsing.md` ICT cleaning rules table — change "External bank (outgoing)" row to reflect purpose code extraction and notes format
