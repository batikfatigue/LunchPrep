## 1. Extract stage diff table into its own file

- [x] 1.1 Create `src/dev-tools/pipeline-inspector/stage-diff-table.tsx` — move the stage diff table markup, `STAGE_ORDER`, `STAGE_LABELS`, `COLUMNS`, `StageRow` type, and pure helpers (`extractRow`, `hasChanged`, `buildStageRows`) from `index.tsx`
- [x] 1.2 Update `index.tsx` to import `StageDiffTable` component and re-export pure helpers for backward compatibility with existing tests
- [x] 1.3 Verify existing pipeline-inspector tests still pass

## 2. Move and adapt export utilities

- [x] 2.1 Create `src/dev-tools/pipeline-inspector/export.ts` — move `extractTransactionPayload`, `buildReviewMarkdown`, and `downloadReviewMarkdown` from `src/dev-tools/categorisation-debugger/export.ts`
- [x] 2.2 Adapt `buildReviewMarkdown` to accept `Map<number, ReviewStatus>` (where `ReviewStatus = { status: 'ok' } | { status: 'flagged', note: string }`) instead of `Map<number, string>`, filtering to flagged-only entries
- [x] 2.3 Add/update unit tests for the adapted export functions

## 3. Create API Result Panel component

- [x] 3.1 Create `src/dev-tools/pipeline-inspector/api-result-panel.tsx` with props: `category` (string | undefined), `reasoning` (string | undefined), `rawPayload` (string | null) — shows category, collapsible reasoning, collapsible API payload
- [x] 3.2 Handle BYOK mode gracefully — show "Not available (BYOK mode)" when reasoning/payload are undefined
- [x] 3.3 Add unit tests for API Result Panel rendering and collapsible behavior

## 4. Create review controls component

- [x] 4.1 Create `src/dev-tools/pipeline-inspector/review-controls.tsx` with OK/Flag buttons, note textarea (always visible, enabled only when flagged), progress counter, and export button
- [x] 4.2 Define `ReviewStatus` type and export from review-controls module
- [x] 4.3 Wire export button to call `buildReviewMarkdown` → `downloadReviewMarkdown` with current review state
- [x] 4.4 Add unit tests for review state transitions (unreviewed → OK, unreviewed → flagged, OK ↔ flagged)

## 5. Update sandbox to capture debug data

- [x] 5.1 Add `debugData` field to `SandboxResult` interface in `sandbox-input.tsx`
- [x] 5.2 Capture the `debug` return from `callCategorise` during Full Pipeline execution and include it in the result
- [x] 5.3 Update sandbox integration tests to verify debug data is passed through

## 6. Integrate into pipeline inspector shell

- [x] 6.1 Add new props to `PipelineInspectorProps`: `categoryMap`, `debugData`, `transactionCount`, `onSelectIndex`
- [x] 6.2 Add keyboard shortcuts (A/D/←/→) for prev/next navigation, O/F for review, with a hint label in the inspector header; shortcuts are disabled at boundaries and suppressed when focus is inside a form input
- [x] 6.3 Compose `StageDiffTable`, `ApiResultPanel`, and `ReviewControls` in the inspector body — show API Result Panel for real transactions when `categoryMap` has data, show review controls only when not sandbox and categoryMap has data
- [x] 6.4 Manage review state (`Map<number, ReviewStatus>`) in inspector component state; clear on snapshot reset
- [x] 6.5 Handle sandbox API Result Panel — pass sandbox category, debug data reasoning/payload to the same `ApiResultPanel` component
- [x] 6.6 Update existing inspector unit tests for new props and composition

## 7. Update page.tsx and delete debugger

- [x] 7.1 Add `categoryMap`, `debugData`, `transactionCount`, and `onSelectIndex` props to the `PipelineInspectorDevTool` render in `page.tsx`
- [x] 7.2 Remove `CategorisationDebuggerDevTool` dynamic import and its render from `page.tsx`
- [x] 7.3 Delete `src/dev-tools/categorisation-debugger/` directory (index.tsx, export.ts)
- [x] 7.4 Verify all tests pass and production build succeeds (`npm run build`)
