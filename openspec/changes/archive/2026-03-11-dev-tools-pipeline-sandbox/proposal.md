## Why

The pipeline inspector currently only shows the journey of real transactions that were already parsed from an uploaded CSV. When developing or debugging parser cleaners, there's no way to quickly test a specific combination of DBS fields (code, ref1, ref2, ref3, credit, debit) against the pipeline without crafting a full CSV file and uploading it. A sandbox would let developers input mock transaction fields directly and see the stage-by-stage result instantly — invaluable for edge case testing and validating cleaner behaviour.

## What Changes

- **Transaction Sandbox UI**: A new input form above the pipeline inspector's stage diff table where developers enter raw DBS fields (transaction code, ref1, ref2, ref3, debit/credit amounts) and execute them through the pipeline.
- **Run mode toggle**: Two execution modes — "Parse + Anonymise" (instant, no API call) and "Full Pipeline" (calls Gemini API, shows category result).
- **Sandbox/Inspect state management**: Executing the sandbox replaces the inspector's current stage diff data. A "Clear" button restores the previously selected real transaction.
- **Shared `buildCsv` utility**: Extract the `buildCsv` helper from `tests/parsers/dbs.test.ts` into `src/dev-tools/pipeline-inspector/` so both the sandbox component and tests can reuse it.
- **API Result Panel**: A section below the stage diff table that shows the category output when running in Full Pipeline mode. Designed as the future home for reasoning and payload inspection when the categorisation debugger is consolidated.

## Capabilities

### New Capabilities
- `pipeline-sandbox`: Transaction sandbox input form, run mode toggle, state management, and API result display within the pipeline inspector.

### Modified Capabilities
- `pipeline-inspector`: The inspector gains a sandbox input section above its stage diff table, sandbox/inspect state toggling, and an API result panel below the diff table.

## Impact

- **`src/dev-tools/pipeline-inspector/`**: New sandbox component, shared `buildCsv` utility, updated inspector layout.
- **`tests/parsers/dbs.test.ts`**: `buildCsv` function replaced with import from `src/dev-tools/pipeline-inspector/mock-csv.ts`.
- **`src/app/page.tsx`**: May need to expose `triggerCategorise` or a subset of its logic so the sandbox can run the full pipeline on a single mock transaction.
- **No production impact**: All changes gated behind `NEXT_PUBLIC_DEV_TOOLS` and isolated to `src/dev-tools/`.