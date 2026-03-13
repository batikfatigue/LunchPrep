## ADDED Requirements

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

### Requirement: Select a transaction by clicking a table row
Clicking a row in the transaction table SHALL select that transaction for
inspection. `page.tsx` SHALL maintain a `selectedIndex` state variable passed
to both `TransactionTable` (to highlight the row) and `PipelineInspector`
(to determine which transaction to show). The selection SHALL persist across
table pagination — navigating to a different page does not clear it.

#### Scenario: Row clicked to select
- **WHEN** user clicks a row in the transaction table
- **THEN** the inspector updates to show the clicked transaction's pipeline journey
- **THEN** the clicked row is visually highlighted in the table

#### Scenario: Selection persists across pagination
- **WHEN** user selects a row on page 1, then navigates to page 2 of the table
- **THEN** the inspector still shows the previously selected transaction

#### Scenario: No selection yet
- **WHEN** the inspector is rendered but no row has been clicked
- **THEN** a placeholder message is shown indicating no transaction is selected

#### Scenario: No snapshot available
- **WHEN** the inspector is rendered but no pipeline run has completed
- **THEN** a placeholder message is shown indicating no data is available

### Requirement: Display per-stage diff table
The inspector SHALL render a table with pipeline stages as rows and transaction
fields as columns. Columns SHALL include: `payee` and `notes`.
Rows SHALL appear in pipeline order: `Raw` → `After Clean` → `After StripPII` →
`Anonymised` → `Sent to Gemini` → `Categorised` → `Restored`.

The three parse sub-stages SHALL be derived from the `parsed` snapshot entry:
- **Raw**: payee from `tx.originalDescription`, notes as `"—"`
- **After Clean**: payee from `tx.parseTrace.cleanedPayee`, notes from `tx.notes`
- **After StripPII**: payee from `tx.description`, notes from `tx.notes`

The remaining stages (`Anonymised`, `Sent to Gemini`, `Categorised`, `Restored`)
SHALL behave as before, sourced from their respective snapshot entries.

When sandbox data is active, the stage diff table SHALL render from the sandbox-built snapshot instead of the page-level snapshot. Stages SHALL be truncated to match the sandbox's run mode (up to `anonymised` for Parse + Anonymise, all 7 for Full Pipeline).

#### Scenario: Full stage table with parse trace
- **WHEN** a transaction is selected and all stages are present in the snapshot
- **WHEN** the transaction has `parseTrace` populated
- **THEN** seven rows are displayed in pipeline order

#### Scenario: Parse trace absent (production or missing)
- **WHEN** a transaction is selected but `parseTrace` is undefined
- **THEN** the `After Clean` row is omitted
- **THEN** `Raw` and `After StripPII` rows are still shown (they use `originalDescription` and `description`)

#### Scenario: Partial snapshot
- **WHEN** a transaction is selected but only some snapshot stages are present
- **THEN** only rows for available stages are displayed

#### Scenario: Sandbox data overrides real transaction
- **WHEN** sandbox data is active
- **THEN** the stage diff table renders from the sandbox snapshot, not the page-level snapshot

### Requirement: Mark fields that changed from the previous stage
For each field in each row, the inspector SHALL display a visual change marker
when the field value differs from the same field in the immediately preceding stage row.
The first stage row (Raw) SHALL never show change markers.

#### Scenario: Payee changes between Raw and After Clean
- **WHEN** `originalDescription` differs from `parseTrace.cleanedPayee`
- **THEN** the `payee` cell in the `After Clean` row displays a change marker

#### Scenario: Notes appear at After Clean
- **WHEN** `Raw` notes is `"—"` and `After Clean` notes is a non-empty string
- **THEN** the `notes` cell in the `After Clean` row displays a change marker

#### Scenario: No change between After Clean and After StripPII
- **WHEN** `parseTrace.cleanedPayee` equals `description` (nothing stripped)
- **THEN** no change marker appears in the `After StripPII` row

#### Scenario: Card number stripped between After Clean and After StripPII
- **WHEN** `parseTrace.cleanedPayee` differs from `description`
- **THEN** the `payee` cell in the `After StripPII` row displays a change marker
### Requirement: Keyboard navigation
The inspector SHALL support keyboard shortcuts for stepping through transactions. When the inspector panel has focus (and sandbox is not active):
- `A` or `←` — navigate to the previous transaction (calls `onSelectIndex(selectedIndex - 1)`)
- `D` or `→` — navigate to the next transaction (calls `onSelectIndex(selectedIndex + 1)`)
- `O` — toggle OK review status for the selected transaction
- `F` — toggle Flagged review status for the selected transaction
- `S` — toggle Flag Summary Overlay visibility
- `W` — jump to the next unreviewed transaction (wrapping)
- `Q` — jump to the previous unreviewed transaction (wrapping)
- `Shift+W` — jump to the next flagged transaction (wrapping)
- `Shift+Q` — jump to the previous flagged transaction (wrapping)

Navigation shortcuts are disabled when `selectedIndex` is null, at the boundary (index 0 for prev, `transactionCount - 1` for next). Shortcuts are suppressed when focus is inside a form input (textarea, input, select) to avoid conflicts with annotation entry.

Navigation updates the selected transaction in the main transaction table (via the `onSelectIndex` callback), keeping the table highlight in sync. A keyboard hint (`Q ‹ unrev · W unrev › · ⇧Q ‹ flag · ⇧W flag › · A ‹ prev · D next › · O ok · F flag · S summary`) is shown in the inspector header when not in sandbox mode. There are no clickable prev/next buttons — keyboard shortcuts are the sole navigation mechanism.

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

#### Scenario: Jump to next unreviewed
- **WHEN** the user presses `W` and unreviewed transactions exist
- **THEN** `onSelectIndex` is called with the index of the next unreviewed transaction (wrapping)

#### Scenario: Jump to previous unreviewed
- **WHEN** the user presses `Q` and unreviewed transactions exist
- **THEN** `onSelectIndex` is called with the index of the previous unreviewed transaction (wrapping)

#### Scenario: Jump to next flagged
- **WHEN** the user presses `Shift+W` and flagged transactions exist
- **THEN** `onSelectIndex` is called with the index of the next flagged transaction (wrapping)

#### Scenario: Jump to previous flagged
- **WHEN** the user presses `Shift+Q` and flagged transactions exist
- **THEN** `onSelectIndex` is called with the index of the previous flagged transaction (wrapping)

### Requirement: Scroll and focus inspector on external selection
When the selected transaction changes due to an external action (e.g. the user clicks a row in the transaction table) and sandbox is not active, the inspector panel SHALL scroll smoothly into view and receive focus. Scrolling and focus-stealing are skipped when the selection change originates from the inspector's own keyboard shortcuts (A/D/←/→), since the panel is already in view and focused during internal navigation.

The inspector SHALL NOT scroll into view when the row click originates from interaction with an `EditableCell` (payee or notes inline editing). Specifically:
- Clicking an `EditableCell` to enter edit mode SHALL NOT trigger scroll.
- Clicking within an active `EditableCell` input SHALL NOT trigger scroll.
- Clicking elsewhere on the row to blur (dismiss) an active `EditableCell` SHALL NOT trigger scroll. The edit is committed, the input is dismissed, but the inspector remains in its current scroll position.
- A subsequent deliberate click on the same row, when no `EditableCell` is in edit mode, SHALL trigger the normal scroll-into-view and focus behaviour.

#### Scenario: Scroll and focus on external row click
- **WHEN** the user clicks a transaction row in the main table (not on an EditableCell)
- **THEN** the inspector panel scrolls smoothly into view
- **THEN** the inspector panel receives focus to enable immediate keyboard shortcuts

#### Scenario: No scroll or focus-steal on internal keyboard navigation
- **WHEN** the user presses A/D/←/→ to navigate within the inspector
- **THEN** the inspector panel does not scroll or trigger an unnecessary focus call (it is already in view and focused)

#### Scenario: No scroll when clicking EditableCell to edit
- **WHEN** the user clicks on a payee or notes EditableCell to enter edit mode
- **THEN** the EditableCell enters edit mode (shows input)
- **THEN** the inspector does NOT scroll into view

#### Scenario: No scroll when clicking inside active EditableCell input
- **WHEN** the user clicks within an already-active EditableCell input
- **THEN** the input retains focus for continued editing
- **THEN** the inspector does NOT scroll into view

#### Scenario: No scroll when dismissing EditableCell by clicking row
- **WHEN** the user clicks elsewhere on the transaction row to blur an active EditableCell
- **THEN** the EditableCell commits the edit and exits edit mode
- **THEN** the inspector does NOT scroll into view

#### Scenario: Scroll resumes after editing is fully dismissed
- **WHEN** no EditableCell is in edit mode
- **WHEN** the user clicks the transaction row
- **THEN** the inspector scrolls smoothly into view and receives focus

### Requirement: API Result Panel for real transactions
The inspector SHALL render an API Result Panel below the stage diff table when a real transaction is selected and categorisation data is available. The panel SHALL display:
- **Category**: From `apiCategoryMap.get(selectedIndex)`
- **Reasoning** (collapsible, expanded by default): From `debugData.perTransaction` for the selected index
- **API Payload** (collapsible, expanded by default): Extracted from `debugData.rawPayload` for the selected index, with the internal `index` field removed

The panel SHALL NOT be rendered when:
- No transaction is selected
- `apiCategoryMap` does not contain the selected index (categorisation has not run)
- Sandbox data is active (sandbox has its own API Result Panel behavior)

> **Note:** `apiCategoryMap` is an immutable snapshot of the AI-assigned categories captured at categorisation time. It is distinct from the mutable `categoryMap` used by the review table and CSV export, ensuring the API Result Panel always reflects the original AI output regardless of user edits.

#### Scenario: Full API Result Panel with debug data
- **WHEN** a real transaction is selected and `apiCategoryMap` and `debugData` are available
- **THEN** the panel shows category, and collapsible reasoning and API payload sections

#### Scenario: API Result Panel without debug data (BYOK mode)
- **WHEN** a real transaction is selected and `apiCategoryMap` is available but `debugData` is null
- **THEN** the panel shows the category
- **THEN** reasoning and API payload sections indicate "Not available (BYOK mode)"

#### Scenario: Panel hidden before categorisation
- **WHEN** `apiCategoryMap` is empty (categorisation has not run)
- **THEN** no API Result Panel is rendered

#### Scenario: Panel hidden when sandbox active
- **WHEN** sandbox data is active
- **THEN** the real transaction API Result Panel is not rendered (sandbox panel takes over)

### Requirement: Categorisation debugger removal
The categorisation debugger (`src/dev-tools/categorisation-debugger/`) has been deleted. Its dynamic import and rendering in `page.tsx` have been removed. All capabilities previously provided by the debugger (category display, reasoning, API payload, annotations, Markdown export) are now available through the pipeline inspector's API Result Panel and review workflow.

### Requirement: Component file decomposition
The pipeline inspector is decomposed into sub-component files to stay within the 500-line limit per file:
- `index.tsx` — Shell component: header with nav and Clear, composes sub-components
- `stage-diff-table.tsx` — Stage diff table with pure helpers (`extractRow`, `hasChanged`, `buildStageRows`)
- `api-result-panel.tsx` — Category, collapsible reasoning, collapsible API payload
- `review-controls.tsx` — OK/Flag buttons, note textarea, progress counter, export button
- `export.ts` — Markdown export functions adapted from the debugger
    - `sandbox-input.tsx` — Sandbox input form
    - `mock-csv.ts` — Mock CSV builder

### Requirement: Flag Summary Overlay
The Pipeline Inspector SHALL provide a "Flag Summary Overlay" providing a consolidated view of all transactions marked with "flagged" status.

The Flag Summary Overlay SHALL:
- Be toggled via the `S` keyboard shortcut.
- Take up approximately 90% of the viewport width and 80% of the viewport height.
- Feature a dimmed, blurred backdrop (backdrop-blur-sm) to isolate it from the background.
- Display a table with columns: **Index** (1-indexed #index), **Raw Description** (`originalDescription`), and **Flag Note**.
- Support interactive navigation: clicking a row SHALL close the overlay, update the `selectedIndex` to that transaction, and trigger the standard scroll/focus behavior.
