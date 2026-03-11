## Context

The pipeline inspector (`src/dev-tools/pipeline-inspector/index.tsx`) currently shows the stage-by-stage journey of a real transaction selected from the transaction table. Developers testing parser edge cases must craft a full CSV, upload it, and run the pipeline to see how a specific field combination is handled.

The test file `tests/parsers/dbs.test.ts` already has a `buildCsv` helper that constructs a minimal DBS CSV from individual fields — exactly the primitive needed for a sandbox.

The categorisation debugger (`src/dev-tools/categorisation-debugger/`) is a separate dev tool that shows Gemini API payload, category output, and reasoning. Its consolidation into the pipeline inspector is planned as a future change but is explicitly out of scope here. However, this design accounts for where that integration will land (the API Result Panel).

## Goals / Non-Goals

**Goals:**
- Let developers input raw DBS fields and see the transaction flow through pipeline stages instantly
- Support two run modes: "Parse + Anonymise" (instant) and "Full Pipeline" (calls Gemini API)
- Show the category result when running Full Pipeline mode
- Share the `buildCsv` utility between sandbox and tests without violating dev-tools isolation
- Sandbox output replaces the inspector's stage diff table; a Clear action restores the previous selection

**Non-Goals:**
- Preset templates for common transaction patterns (future enhancement)
- Categorisation debugger consolidation (separate future change)
- Gemini reasoning or API payload display (comes with debugger consolidation)
- Supporting non-DBS banks in the sandbox (only DBS parser exists today)

## Decisions

### 1. `buildCsv` lives in `src/dev-tools/pipeline-inspector/mock-csv.ts`

The function is extracted from `tests/parsers/dbs.test.ts` into the dev-tools directory. The test file imports from there.

**Why not `src/lib/`?** The function is only useful for testing and dev-tools — it has no production purpose. Placing it in `src/lib/` would pollute the production source tree.

**Why not keep in tests?** Test files aren't part of the bundled source tree. The sandbox component runs in the browser and cannot import from test files.

**Isolation safety:** The dev-tools isolation rule (`docs/dev-tools.md`) prohibits production files from importing `src/dev-tools/`. Test files are not production files, so this import is allowed.

### 2. Sandbox is a sibling component, not embedded in the inspector

A new `SandboxInput` component at `src/dev-tools/pipeline-inspector/sandbox-input.tsx` handles the form and execution logic. The main `index.tsx` composes `SandboxInput` above the stage diff table.

**Why separate?** The inspector component is already 280 lines. Adding form state, validation, and pipeline execution would push it well past the 500-line limit. Separation also makes the sandbox independently testable.

### 3. Sandbox executes the pipeline internally, not via page.tsx

The sandbox imports `dbsParser`, `anonymise`, `restore`, and `callCategorise` directly and runs them in sequence, building its own `PipelineSnapshot`. It does not call back into `page.tsx`'s `triggerCategorise`.

**Why?** The sandbox operates on a single mock transaction independent of the uploaded CSV. Coupling it to page-level state would require `page.tsx` to know about sandbox concerns, creating an unnecessary dependency from the page into dev-tools logic. The sandbox is self-contained.

**Trade-off:** This means the sandbox duplicates the snapshot-building logic from `triggerCategorise`. This is acceptable because: (a) the logic is straightforward (call functions in sequence, capture results), and (b) the sandbox may want to behave differently (e.g., truncating stages based on run mode).

### 4. Run mode is a split button or dropdown on Execute

The Execute button offers two modes:
- **Parse + Anonymise**: Calls `dbsParser.parse()` → `anonymise()`. Shows stages up to `anonymised`. No API key needed.
- **Full Pipeline**: Additionally calls `callCategorise()` → `restore()`. Shows all 7 stages plus the API Result Panel with the assigned category.

**Why not a separate toggle?** Combining it with Execute reduces UI clutter and makes the action explicit — you choose when you click.

### 5. State management: sandbox override with Clear restore

The inspector component gains a `sandboxSnapshot` state. When populated, the stage diff table renders from `sandboxSnapshot` instead of the real `snapshots` prop. Clicking "Clear" nulls `sandboxSnapshot`, restoring the real transaction view.

The `selectedIndex` from props is preserved — Clear returns to whatever row was previously selected.

### 6. API Result Panel is a simple section below the diff table

When the sandbox runs in Full Pipeline mode, a panel below the diff table shows:
- **Category**: The category assigned by Gemini

This panel is intentionally minimal. It will become the landing zone for reasoning and payload inspection when the categorisation debugger is consolidated in a future change.

### 7. Categories and API key: sourced from page-level props

The sandbox needs `categories` and `apiKey` for Full Pipeline mode. These are passed down from `page.tsx` through the inspector's props. This is the simplest approach — the page already manages this state.

## Risks / Trade-offs

- **Duplicated pipeline logic** — The sandbox re-implements the snapshot-building sequence from `triggerCategorise`. If the pipeline stages change, both need updating. → Acceptable for now; a shared `runPipeline` utility could be extracted if this becomes a maintenance burden.
- **Single-transaction anonymisation** — `anonymise()` is designed for batches. Running it on a single-transaction array may produce different anonymisation results than a batch. → This is actually useful for sandbox testing — it shows how a single transaction would be anonymised in isolation. Document this in the UI.
- **API cost on Full Pipeline** — Each Full Pipeline run costs a Gemini API call. → Mitigated by making Parse + Anonymise the default/primary action, with Full Pipeline as a deliberate secondary choice.
