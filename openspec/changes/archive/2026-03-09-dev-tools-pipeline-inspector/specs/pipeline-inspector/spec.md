## ADDED Requirements

### Requirement: Render as inline detail pane on main page
The pipeline inspector SHALL be mounted as a detail pane below the transaction
table on the main page (`src/app/page.tsx`), via a build-time gated dynamic
import (`NEXT_PUBLIC_DEV_TOOLS === 'true'`). It SHALL NOT render or be included
in the production bundle when the gate is inactive.

#### Scenario: Rendered in dev environment
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS === 'true'` and a pipeline run has completed
- **THEN** the inspector panel is visible below the transaction table

#### Scenario: Absent in production
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS` is unset or not `'true'`
- **THEN** the inspector component is not rendered and not included in the bundle

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
Rows SHALL appear in pipeline order: `parsed` → `anonymised` → `sent` → `categorised` → `restored`.
The `sent` row SHALL display fields from the Gemini payload shape.

#### Scenario: Full stage table rendered
- **WHEN** a transaction is selected and all stages are present in the snapshot
- **THEN** five rows are displayed, one per stage, in pipeline order

#### Scenario: Partial snapshot
- **WHEN** a transaction is selected but only some stages are present
- **THEN** only rows for captured stages are displayed

### Requirement: Mark fields that changed from the previous stage
For each field in each row, the inspector SHALL display a visual change marker
when the field value differs from the same field in the immediately preceding stage row.
The first stage row (parsed) SHALL never show change markers.

#### Scenario: Payee anonymised at anonymised stage
- **WHEN** `anonymised.payee` differs from `parsed.payee`
- **THEN** the `payee` cell in the `anonymised` row displays a change marker

#### Scenario: Unchanged field has no marker
- **WHEN** `notes` is identical across all stages
- **THEN** no change marker appears in the `notes` column for any row

#### Scenario: Payee restored at restored stage
- **WHEN** `restored.payee` differs from `categorised.payee`
- **THEN** the `payee` cell in the `restored` row displays a change marker