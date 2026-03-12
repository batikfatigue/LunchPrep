## ADDED Requirements

### Requirement: Sandbox input form
The pipeline inspector SHALL render a sandbox input form above the stage diff table. The form SHALL contain the following fields:
- **Transaction Code**: free-text input (allows testing unknown codes for catch-all fallback)
- **Ref1**, **Ref2**, **Ref3**: text inputs for the three reference fields
- **Debit Amount**, **Credit Amount**: numeric inputs (only one may be filled)
- **Date**: text input, defaulting to today's date in DBS format (e.g. "10 Mar 2026")

The Description column SHALL be derived automatically by concatenating `Ref1 + ' ' + Ref2 + ' ' + Ref3`, matching DBS CSV format. It SHALL NOT be a user-editable field.

#### Scenario: Form is rendered above stage diff table
- **WHEN** the pipeline inspector is visible
- **THEN** the sandbox input form is displayed above the stage diff table

#### Scenario: Default field values
- **WHEN** the sandbox form is first rendered
- **THEN** Transaction Code defaults to "ICT", Date defaults to today in DBS format, and all other fields are empty

### Requirement: Shared buildCsv utility
The `buildCsv` function SHALL be extracted from `tests/parsers/dbs.test.ts` into `src/dev-tools/pipeline-inspector/mock-csv.ts`. Both the sandbox component and the test file SHALL import from this shared location.

The function SHALL accept individual DBS fields (code, ref1, ref2, ref3, debit, credit, date) and return a complete DBS CSV string with 6 metadata rows, a header row, and one data row. The Description column SHALL be derived by concatenating `ref1 + ' ' + ref2 + ' ' + ref3`.

#### Scenario: Sandbox uses buildCsv to construct CSV
- **WHEN** the user clicks Execute in the sandbox
- **THEN** the sandbox calls `buildCsv` with the form field values to produce a valid DBS CSV string

#### Scenario: Test file imports from shared location
- **WHEN** `tests/parsers/dbs.test.ts` uses `buildCsv`
- **THEN** it imports from `@/dev-tools/pipeline-inspector/mock-csv`

#### Scenario: Production isolation maintained
- **WHEN** building for production (`NEXT_PUBLIC_DEV_TOOLS` is unset)
- **THEN** `mock-csv.ts` is not included in the production bundle (it resides in `src/dev-tools/`)

### Requirement: Run mode toggle
The Execute action SHALL offer two run modes:
- **Parse + Anonymise**: Runs `dbsParser.parse()` → `anonymise()`. Shows stages up to `anonymised` only. No API key required.
- **Full Pipeline**: Additionally runs `callCategorise()` → `restore()`. Shows all 7 stages plus the API Result Panel. Requires an API key and category list.

Parse + Anonymise SHALL be the default mode.

#### Scenario: Parse + Anonymise execution
- **WHEN** the user clicks Execute with "Parse + Anonymise" selected
- **THEN** the stage diff table shows stages: Raw, After Clean, After StripPII, Anonymised
- **THEN** the API Result Panel is not shown

#### Scenario: Full Pipeline execution
- **WHEN** the user clicks Execute with "Full Pipeline" selected
- **THEN** the stage diff table shows all 7 stages
- **THEN** the API Result Panel displays the assigned category

#### Scenario: Full Pipeline without API key
- **WHEN** the user clicks Execute with "Full Pipeline" but no API key is configured
- **THEN** an appropriate error is shown

### Requirement: Sandbox replaces inspector data with Clear restore
When the sandbox is executed, the stage diff table SHALL display the sandbox transaction's pipeline journey, replacing whatever real transaction was previously shown.

A "Clear" button SHALL be visible in the pipeline inspector header when sandbox data is active. Clicking Clear SHALL remove the sandbox data and restore the stage diff table to show the previously selected real transaction (if any).

#### Scenario: Execute replaces inspector content
- **WHEN** the user has selected a real transaction and then clicks Execute in the sandbox
- **THEN** the stage diff table shows the sandbox transaction's stages instead of the real transaction

#### Scenario: Clear restores previous selection
- **WHEN** sandbox data is active and the user clicks Clear
- **THEN** the stage diff table returns to showing the previously selected real transaction

#### Scenario: Clear with no previous selection
- **WHEN** sandbox data is active but no real transaction was previously selected
- **THEN** clicking Clear returns the inspector to its "no selection" placeholder state

### Requirement: API Result Panel
When the sandbox runs in Full Pipeline mode, a panel SHALL be displayed below the stage diff table showing:
- **Category**: The category assigned by Gemini for the sandbox transaction

The panel SHALL NOT be shown when running in Parse + Anonymise mode. The panel SHALL NOT be shown for real (non-sandbox) transaction inspections.

#### Scenario: Category displayed after Full Pipeline
- **WHEN** Full Pipeline execution completes successfully
- **THEN** the API Result Panel shows the Gemini-assigned category below the stage diff table

#### Scenario: Panel hidden in Parse + Anonymise mode
- **WHEN** the sandbox runs in Parse + Anonymise mode
- **THEN** no API Result Panel is rendered

#### Scenario: Panel hidden for real transactions
- **WHEN** a real transaction is selected (not sandbox)
- **THEN** no API Result Panel is rendered

### Requirement: Pipeline execution is self-contained
The sandbox SHALL execute the pipeline internally by importing `dbsParser`, `anonymise`, `restore`, and `callCategorise` directly. It SHALL build its own `PipelineSnapshot` from the execution results. It SHALL NOT call back into `page.tsx`'s `triggerCategorise`.

Categories and API key SHALL be received as props from the page via the inspector component.

#### Scenario: Sandbox builds its own snapshot
- **WHEN** the sandbox executes
- **THEN** it constructs a `PipelineSnapshot` from the pipeline function results
- **THEN** the stage diff table renders from this sandbox-built snapshot

#### Scenario: Categories and API key are passed as props
- **WHEN** the inspector is rendered on the page
- **THEN** it receives `categories` and `apiKey` from page-level state