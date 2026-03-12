## 1. Type & Parser Changes

- [x] 1.1 Add optional `parseTrace?: { cleanedPayee: string }` field to `RawTransaction` in `src/lib/parsers/types.ts`
- [x] 1.2 In `dbs.ts` `parse()`, capture `cleaned.payee` into `parseTrace.cleanedPayee` before the `stripPII()` call, gated behind `process.env.NEXT_PUBLIC_DEV_TOOLS === "true"`
- [x] 1.3 Update existing parser tests to verify `parseTrace` is populated when dev gate is active and absent otherwise

## 2. Pipeline Inspector Updates

- [x] 2.1 Update `STAGE_ORDER` and `STAGE_LABELS` in `src/dev-tools/pipeline-inspector/index.tsx` to include `raw`, `afterClean`, and `afterStripPII` before the existing stages, removing `parsed`
- [x] 2.2 Update `extractRow()` to derive the three parse sub-stage rows from `RawTransaction` fields in the `parsed` snapshot: `originalDescription` for raw, `parseTrace.cleanedPayee` for afterClean, `description` for afterStripPII
- [x] 2.3 Handle missing `parseTrace` gracefully — omit the `afterClean` row when `parseTrace` is undefined
- [x] 2.4 Set notes column to `"—"` for the `raw` stage row

## 3. Tests

- [x] 3.1 Add pipeline inspector unit tests for the new parse sub-stages: verify row extraction, change marker logic, and missing `parseTrace` fallback
- [x] 3.2 Verify existing pipeline inspector tests still pass with the updated stage order
