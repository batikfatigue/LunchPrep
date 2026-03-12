## MODIFIED Requirements

### Requirement: Render as inline detail pane on main page
The pipeline inspector SHALL be mounted as a detail pane below the transaction table on the main page (`src/app/page.tsx`), via a build-time gated dynamic import (`NEXT_PUBLIC_DEV_TOOLS === 'true'`). It SHALL NOT render or be included in the production bundle when the gate is inactive.

The inspector SHALL receive the following props from the page:
- `snapshots` (PipelineSnapshot) — transaction state at each pipeline stage
- `selectedIndex` (number | null) — currently selected transaction row
- `categories` (string[]) — category list for sandbox Full Pipeline mode
- `apiKey` (string) — Gemini API key for sandbox Full Pipeline mode
- `categoryMap` (ReadonlyMap<number, string>) — assigned categories per transaction index
- `debugData` (DebugData | null) — Gemini reasoning and raw payload from the API
- `transactionCount` (number) — total number of transactions for navigation bounds
- `onSelectIndex` ((index: number) => void) — callback to update selected transaction

#### Scenario: Rendered in dev environment
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS === 'true'` and a pipeline run has completed
- **THEN** the inspector panel is visible below the transaction table

#### Scenario: Absent in production
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS` is unset or not `'true'`
- **THEN** the inspector component is not rendered and not included in the bundle

#### Scenario: Props include all required data
- **WHEN** the inspector is rendered
- **THEN** it receives `snapshots`, `selectedIndex`, `categories`, `apiKey`, `categoryMap`, `debugData`, `transactionCount`, and `onSelectIndex` from page-level state

## ADDED Requirements

### Requirement: Keyboard navigation
The inspector SHALL support keyboard shortcuts for stepping through transactions. When the inspector panel has focus (and sandbox is not active):
- `A` or `←` — navigate to the previous transaction (calls `onSelectIndex(selectedIndex - 1)`)
- `D` or `→` — navigate to the next transaction (calls `onSelectIndex(selectedIndex + 1)`)
- `O` — toggle OK review status for the selected transaction
- `F` — toggle Flagged review status for the selected transaction

Navigation shortcuts are disabled when `selectedIndex` is null, at the boundary (index 0 for prev, `transactionCount - 1` for next). Shortcuts are suppressed when focus is inside a form input (textarea, input, select) to avoid conflicts with annotation entry.

Navigation updates the selected transaction in the main transaction table (via the `onSelectIndex` callback), keeping the table highlight in sync. A keyboard hint (`A ‹ prev · D next › · O ok · F flag`) is shown in the inspector header when not in sandbox mode. There are no clickable prev/next buttons — keyboard shortcuts are the sole navigation mechanism.

### Requirement: Scroll to inspector on external selection
When the selected transaction changes due to an external action (e.g. the user clicks a row in the transaction table) and sandbox is not active, the inspector panel SHALL scroll smoothly into view. Scrolling is skipped when the selection change originates from the inspector's own keyboard shortcuts (A/D/←/→), since the panel is already in view during internal navigation.

#### Scenario: Scroll on external row click
- **WHEN** the user clicks a transaction row in the main table
- **THEN** the inspector panel scrolls smoothly into view

#### Scenario: No scroll on internal keyboard navigation
- **WHEN** the user presses A/D/←/→ to navigate within the inspector
- **THEN** the inspector panel does not scroll (it is already in view)

#### Scenario: Navigate to next transaction
- **WHEN** the user presses `D` or `→` and `selectedIndex` is less than `transactionCount - 1`
- **THEN** `onSelectIndex` is called with `selectedIndex + 1`
- **THEN** the inspector displays the next transaction's pipeline journey

#### Scenario: Navigate to previous transaction
- **WHEN** the user presses `A` or `←` and `selectedIndex` is greater than 0
- **THEN** `onSelectIndex` is called with `selectedIndex - 1`

#### Scenario: Next navigation ignored at last transaction
- **WHEN** `selectedIndex` equals `transactionCount - 1`
- **THEN** pressing `D` or `→` has no effect

#### Scenario: Prev navigation ignored at first transaction
- **WHEN** `selectedIndex` is 0
- **THEN** pressing `A` or `←` has no effect

#### Scenario: Navigation ignored when no selection
- **WHEN** `selectedIndex` is null
- **THEN** all navigation shortcuts have no effect

#### Scenario: Shortcuts suppressed in textarea
- **WHEN** focus is inside the annotation textarea
- **THEN** `A`, `D`, `←`, `→` key events are not intercepted by the inspector

### Requirement: API Result Panel for real transactions
The inspector SHALL render an API Result Panel below the stage diff table when a real transaction is selected and categorisation data is available. The panel SHALL display:
- **Category**: From `categoryMap.get(selectedIndex)`
- **Reasoning** (collapsible, expanded by default): From `debugData.perTransaction` for the selected index
- **API Payload** (collapsible, expanded by default): Extracted from `debugData.rawPayload` for the selected index, with the internal `index` field removed

The panel SHALL NOT be rendered when:
- No transaction is selected
- `categoryMap` does not contain the selected index (categorisation has not run)
- Sandbox data is active (sandbox has its own API Result Panel behavior)

#### Scenario: Full API Result Panel with debug data
- **WHEN** a real transaction is selected and `categoryMap` and `debugData` are available
- **THEN** the panel shows category, and collapsible reasoning and API payload sections

#### Scenario: API Result Panel without debug data (BYOK mode)
- **WHEN** a real transaction is selected and `categoryMap` is available but `debugData` is null
- **THEN** the panel shows the category
- **THEN** reasoning and API payload sections indicate "Not available (BYOK mode)"

#### Scenario: Panel hidden before categorisation
- **WHEN** `categoryMap` is empty (categorisation has not run)
- **THEN** no API Result Panel is rendered

#### Scenario: Panel hidden when sandbox active
- **WHEN** sandbox data is active
- **THEN** the real transaction API Result Panel is not rendered (sandbox panel takes over)

### Requirement: Categorisation debugger removal
The categorisation debugger (`src/dev-tools/categorisation-debugger/`) SHALL be deleted entirely. Its dynamic import and rendering in `page.tsx` SHALL be removed. The debugger's trigger button SHALL no longer appear in the action bar.

All capabilities previously provided by the debugger (category display, reasoning, API payload, annotations, Markdown export) SHALL be available through the pipeline inspector's API Result Panel and review workflow.

#### Scenario: Debugger files deleted
- **WHEN** the merge is complete
- **THEN** `src/dev-tools/categorisation-debugger/index.tsx` and `src/dev-tools/categorisation-debugger/export.ts` no longer exist

#### Scenario: Debugger import removed from page
- **WHEN** the merge is complete
- **THEN** `page.tsx` no longer imports or renders `CategorisationDebuggerDevTool`

#### Scenario: Production build still passes
- **WHEN** building for production after the merge
- **THEN** the build succeeds with no references to the deleted debugger

### Requirement: Component file decomposition
The pipeline inspector SHALL be decomposed into sub-component files to stay within the 500-line limit per file:
- `index.tsx` — Shell component: header with nav and Clear, composes sub-components
- `stage-diff-table.tsx` — Stage diff table with pure helpers (`extractRow`, `hasChanged`, `buildStageRows`)
- `api-result-panel.tsx` — Category, collapsible reasoning, collapsible API payload
- `review-controls.tsx` — OK/Flag buttons, note textarea, progress counter, export button
- `export.ts` — Markdown export functions adapted from the debugger
- `sandbox-input.tsx` — Unchanged (already exists)
- `mock-csv.ts` — Unchanged (already exists)

#### Scenario: No single file exceeds 500 lines
- **WHEN** the merge is complete
- **THEN** every file in `src/dev-tools/pipeline-inspector/` is under 500 lines

#### Scenario: Pure helpers remain testable
- **WHEN** `extractRow`, `hasChanged`, and `buildStageRows` are moved to `stage-diff-table.tsx`
- **THEN** they remain exported and testable via existing unit tests
