## MODIFIED Requirements

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
