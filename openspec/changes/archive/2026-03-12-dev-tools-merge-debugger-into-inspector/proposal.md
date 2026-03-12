## Why

The categorisation debugger and pipeline inspector are two separate dev tools that inspect the same pipeline run from different angles — the debugger shows API results (category, reasoning, payload) across all transactions in a full-screen overlay, while the inspector shows stage-by-stage field transformations for a single transaction inline. In practice, reviewing always happens one transaction at a time, making the overlay redundant. Merging the debugger's capabilities into the inspector creates a single, unified tool for both pipeline inspection and categorisation review.

## What Changes

- **Expand the API Result Panel** in the pipeline inspector to show category, Gemini reasoning (collapsible), and per-transaction API payload (collapsible) — for both real transactions and sandbox full-pipeline runs.
- **Add a review workflow** with OK/Flag/Note controls per transaction, a progress counter (e.g. "12/47 reviewed"), and export of flagged items to Markdown.
- **Add prev/next navigation** in the inspector header to step through transactions without clicking the table.
- **Hide review controls when sandbox is active** — sandbox is for testing, not reviewing.
- **Show the API Result Panel only after categorisation has run** — hidden when no category data exists.
- **Delete `src/dev-tools/categorisation-debugger/`** entirely and remove its page-level import/rendering from `page.tsx`.
- **Extract `stage-diff-table` into its own file** to keep the inspector's `index.tsx` under the 500-line limit.
- **Move `export.ts`** from the debugger into the inspector directory, adapted for the new review model (flagged-only export with OK/Flagged/Unreviewed states).

## Capabilities

### New Capabilities
- `dev-tools-review-workflow`: Transaction review workflow within the pipeline inspector — OK/Flag/Note states, progress tracking, and Markdown export of flagged items.

### Modified Capabilities
- `pipeline-inspector`: Gains API Result Panel (category, reasoning, payload), prev/next navigation, and replaces the categorisation debugger as the sole inspection tool.
- `dev-tools-pipeline-sandbox`: Sandbox execution captures debug data (reasoning/payload) from `callCategorise` for display in the expanded API Result Panel.

## Impact

- **Deleted**: `src/dev-tools/categorisation-debugger/` (index.tsx, export.ts) — ~863 lines removed.
- **Modified**: `src/dev-tools/pipeline-inspector/` — new sub-components added, `index.tsx` refactored.
- **Modified**: `src/dev-tools/pipeline-inspector/sandbox-input.tsx` — captures `DebugData` from `callCategorise`.
- **Modified**: `src/app/page.tsx` — removes debugger import/render, threads `categoryMap`, `debugData`, `txCount`, `onSelectIndex` to inspector.
- **Modified**: `openspec/specs/dev-tools-categorisation-debugger/spec.md` — retired (requirements absorbed into inspector).
- **No production code changes** — all changes confined to `src/dev-tools/` and the gated dev-tools import in `page.tsx`.
