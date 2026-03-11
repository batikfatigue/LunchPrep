## MODIFIED Requirements

### Requirement: Render as inline detail pane on main page
The pipeline inspector SHALL be mounted as a detail pane below the transaction
table on the main page (`src/app/page.tsx`), via a build-time gated dynamic
import (`NEXT_PUBLIC_DEV_TOOLS === 'true'`). It SHALL NOT render or be included
in the production bundle when the gate is inactive.

The inspector SHALL additionally receive `categories` and `apiKey` props from the page, for use by the sandbox's Full Pipeline mode.

#### Scenario: Rendered in dev environment
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS === 'true'` and a pipeline run has completed
- **THEN** the inspector panel is visible below the transaction table

#### Scenario: Absent in production
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS` is unset or not `'true'`
- **THEN** the inspector component is not rendered and not included in the bundle

#### Scenario: Props include categories and apiKey
- **WHEN** the inspector is rendered
- **THEN** it receives `categories` (string[]) and `apiKey` (string) from page-level state

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
