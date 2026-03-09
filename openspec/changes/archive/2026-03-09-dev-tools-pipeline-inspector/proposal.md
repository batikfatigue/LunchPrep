## Why

The anonymisation pipeline transforms transaction data through multiple stages before sending it to Gemini, but there is currently no way to inspect what a transaction looks like at each stage. This makes it difficult to verify anonymisation decisions, debug categorisation issues, and confirm what data actually left the browser.

## What Changes

- A `PipelineSnapshot` state variable built up in `handleCategorise` in `src/app/page.tsx`, passed as a prop to the inspector component
- New dev tool `src/dev-tools/pipeline-inspector/` providing a single-transaction inspector with a per-stage diff table and field-level change markers, mounted inline on the main page via a build-time gated dynamic import
- To delete the feature: remove `src/dev-tools/pipeline-inspector/`, the snapshot state variable, and the component mount — no other files are affected

## Capabilities

### New Capabilities
- `pipeline-snapshot`: Data structure and builder that captures `RawTransaction[]` state at each named pipeline stage (parsed, anonymised, categorised, restored) and Gemini payload shape at the `sent` stage
- `pipeline-inspector`: Dev tool UI component that renders a selected transaction's full journey through all pipeline stages, with field-level diff markers highlighting what changed at each step

### Modified Capabilities
- (none)

## Impact

- `src/app/page.tsx` — snapshot state variable and build-time gated `<PipelineInspector />` mount
- `src/dev-tools/pipeline-inspector/` — new isolated dev tool directory
- No changes to existing parser, anonymiser, or categoriser library code
- No production bundle impact (excluded via `NEXT_PUBLIC_DEV_TOOLS` build-time gate)
