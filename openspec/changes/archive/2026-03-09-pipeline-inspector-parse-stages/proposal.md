## Why

The pipeline inspector currently starts at the `parsed` stage, after the DBS parser has already performed the most aggressive data manipulation — Ref field extraction, card number stripping, reference ID removal, and title-casing. There is no way to see what data the parser discarded or transformed, making it difficult to verify whether meaningful information was lost during parsing or whether PII was correctly stripped.

## What Changes

- Add an optional `parseTrace` field to `RawTransaction` that captures the per-code cleaner's payee output before `stripPII` runs
- Extend the pipeline inspector's stage table with three new rows at the front: **Raw** (from `originalDescription`), **After Clean** (from `parseTrace.cleanedPayee`), and **After StripPII** (from `description`) — surfacing the parse-internal transformation steps
- Populate `parseTrace` in `dbs.ts` during parsing, gated behind `NEXT_PUBLIC_DEV_TOOLS` to avoid unnecessary allocation in production
- Update `PipelineSnapshot` type and inspector component to render the expanded stage sequence

## Capabilities

### New Capabilities

- `parse-trace`: Data captured during parsing that records intermediate transformation state (per-code cleaner output before general PII stripping), attached to each `RawTransaction`

### Modified Capabilities

- `pipeline-inspector`: Stage table gains three new rows (Raw, After Clean, After StripPII) sourced from `originalDescription`, `parseTrace`, and `description`, extending the visible pipeline from 5 stages to 7
- `pipeline-snapshot`: No structural change needed — the new stages are derived from fields already on `RawTransaction` at the `parsed` stage, not from new snapshot keys

## Impact

- `src/lib/parsers/types.ts` — `RawTransaction` gains optional `parseTrace` field
- `src/lib/parsers/dbs.ts` — capture `cleaned.payee` before `stripPII()` call
- `src/dev-tools/pipeline-inspector/index.tsx` — add Raw, After Clean, After StripPII stage rows; read from `originalDescription` and `parseTrace`
- No changes to anonymiser, categoriser, exporter, or API routes
- No production bundle impact beyond the `parseTrace` field (which can be gated)
