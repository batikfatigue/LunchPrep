## Context

The pipeline inspector (`src/dev-tools/pipeline-inspector/`) and categorisation debugger (`src/dev-tools/categorisation-debugger/`) are two separate dev tools that inspect the same pipeline run. The debugger opens as a full-screen overlay showing all transactions with API payload, reasoning, and annotations. The inspector renders inline below the transaction table showing stage-by-stage field transformations for a single selected transaction.

In practice, reviewing always happens one transaction at a time. The debugger's overlay UI and all-at-once table are unnecessary — clicking through rows in the main transaction table is sufficient. This change merges the debugger's unique capabilities (category display, reasoning, API payload, annotations, markdown export) into the inspector, then deletes the debugger entirely.

Both tools follow Pattern B (contextual, page-level) from `docs/dev-tools.md`, using build-time gated dynamic imports. After the merge, only one page-level dev-tool import remains.

## Goals / Non-Goals

**Goals:**
- Consolidate into a single dev tool for pipeline inspection and categorisation review
- Add API Result Panel showing category, reasoning (collapsible), and API payload (collapsible) for both real transactions and sandbox runs
- Add a review workflow with OK/Flag/Note states, progress tracking, and flagged-only Markdown export
- Add prev/next navigation in the inspector header for stepping through transactions
- Delete the categorisation debugger entirely (~863 lines removed)
- Maintain all three dev-tools isolation layers (physical, build-time, reasoning)

**Non-Goals:**
- Review state persistence across page refreshes (future change)
- Session history with multiple CSV uploads (future change)
- Any production code changes — all work stays within `src/dev-tools/` and the gated import in `page.tsx`

## Decisions

### 1. Thread `categoryMap` and `debugData` through to the inspector

The inspector currently receives `snapshots`, `selectedIndex`, `categories`, and `apiKey`. The debugger receives `transactions`, `categoryMap`, and `debugData`. After the merge, the inspector needs the debugger's data too.

**New props added to `PipelineInspectorProps`:**
- `categoryMap: ReadonlyMap<number, string>` — for displaying the assigned category
- `debugData: DebugData | null` — for reasoning and API payload
- `transactionCount: number` — for prev/next navigation bounds
- `onSelectIndex: (index: number) => void` — callback to update `selectedIndex` from prev/next buttons

**Alternative considered:** Passing `transactions` array instead of `transactionCount`. Rejected because the inspector only needs the count for navigation bounds — passing the full array would be unnecessary coupling.

### 2. Expand the API Result Panel for both real transactions and sandbox

The current API Result Panel only shows category for sandbox full-pipeline runs. After merge, it shows for real transactions too (when `categoryMap` has data for the selected index).

**Contents:**
- **Category**: From `categoryMap.get(selectedIndex)` (real tx) or `SandboxResult.category` (sandbox)
- **Reasoning** (collapsible): From `debugData.perTransaction` (real tx) or sandbox debug data
- **API Payload** (collapsible): Extracted from `debugData.rawPayload` via `extractTransactionPayload`

**BYOK limitation**: When using a BYOK API key, `callGeminiDirect` does not return `DebugData`. Reasoning and payload sections show "Not available (BYOK mode)" gracefully. This is a pre-existing limitation.

**Sandbox debug data**: The sandbox currently discards the `debug` return from `callCategorise`. The sandbox component will be updated to capture and include it in `SandboxResult`.

### 3. Review workflow as a separate sub-component

Review state is managed in the inspector as `Map<number, ReviewStatus>` where:
```
ReviewStatus = { status: 'ok' } | { status: 'flagged', note: string }
```

Transactions start as unreviewed (absent from the map). The review section renders below the API Result Panel with:
- OK button (marks as reviewed, no issues)
- Flag button (marks as flagged, shows note textarea)
- Progress counter: "X/Y reviewed"
- Export button (downloads Markdown of flagged items only)

**Hidden when sandbox is active** — sandbox is for testing, not reviewing.

**Review state is ephemeral** — stored in React component state, lost on page refresh. Persistence is explicitly deferred to a future change.

### 4. Prev/Next navigation updates `selectedIndex` via callback

The inspector header gains prev/next buttons that call `onSelectIndex(selectedIndex ± 1)`. This updates the `selectedIndex` state in `page.tsx`, which also updates the highlight in the transaction table. Navigation is bounded by `transactionCount`.

**Alternative considered:** Arrow key handlers. Rejected for now — key events could conflict with annotation text areas and other inputs. Simple buttons are sufficient.

### 5. Component file decomposition

The merged inspector would exceed the 500-line limit. Split into focused sub-components:

```
src/dev-tools/pipeline-inspector/
├── index.tsx                # Shell: header with nav + Clear, composes sub-components
├── stage-diff-table.tsx     # Extracted: stage diff table + pure helpers
├── api-result-panel.tsx     # NEW: category, collapsible reasoning & payload
├── review-controls.tsx      # NEW: OK/Flag buttons, note textarea, progress, export
├── export.ts                # MOVED from debugger, adapted for review model
├── sandbox-input.tsx        # MODIFIED: captures DebugData in SandboxResult
└── mock-csv.ts              # Unchanged
```

Pure helpers (`extractRow`, `hasChanged`, `buildStageRows`) move to `stage-diff-table.tsx`. The `extractTransactionPayload` function moves from the debugger's `export.ts` to the inspector's `export.ts`. `buildReviewMarkdown` is adapted to accept the new `ReviewStatus` model instead of bare annotation strings.

### 6. Delete categorisation debugger

After all debugger capabilities are available in the inspector:
- Delete `src/dev-tools/categorisation-debugger/` (index.tsx, export.ts)
- Remove the `CategorisationDebuggerDevTool` dynamic import and render from `page.tsx`
- Remove props passed only for the debugger (`transactions` to debugger, `debugData` to debugger)

The existing spec at `openspec/specs/dev-tools-categorisation-debugger/spec.md` is retired — its requirements are absorbed into the inspector's spec.

### 7. Use shadcn/ui + Tailwind, not inline styles

The debugger uses inline CSS (dark theme, purple accents). The inspector uses shadcn/ui + Tailwind. The merged component follows the inspector's pattern. No inline styles are carried over from the debugger.

## Risks / Trade-offs

**[Risk] Losing the all-at-once transaction view** → Mitigated by prev/next navigation for sequential review. The main transaction table already provides the overview. In practice, users always reviewed one at a time.

**[Risk] Merged inspector file size** → Mitigated by decomposing into 5+ sub-component files per Decision #5.

**[Risk] BYOK users see reduced API Result Panel** → Acceptable pre-existing limitation. Category is always shown. Only reasoning and raw payload are unavailable without proxy-route debug data.

**[Risk] Ephemeral review state** → Accepted trade-off for this change. Losing review progress on refresh is inconvenient but not blocking. Persistence is scoped to a separate future change.

**[Trade-off] Removing the debugger overlay removes the dedicated keyboard shortcut (Escape to close)** → The inspector is inline, always visible — no overlay to dismiss. Net simpler UX.
