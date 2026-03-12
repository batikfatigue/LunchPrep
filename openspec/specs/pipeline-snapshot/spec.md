## ADDED Requirements

### Requirement: Define pipeline snapshot data structure
The system SHALL define a `PipelineSnapshot` type that holds transaction state
captured at each named stage of the anonymisation pipeline.
Stages `parsed`, `anonymised`, `categorised`, and `restored` SHALL store
`RawTransaction[]`. The `sent` stage SHALL store the Gemini request payload
shape (`Array<{ index: number; payee: string; notes: string; transactionType: string }>`).
All stage keys SHALL be optional — absent keys indicate the stage has not yet run.

The parse sub-stages (Raw, After Clean, After StripPII) SHALL NOT be represented
as separate keys in `PipelineSnapshot`. They are derived from fields on
`RawTransaction` objects within the existing `parsed` stage entry:
- Raw: `tx.originalDescription`
- After Clean: `tx.parseTrace?.cleanedPayee`
- After StripPII: `tx.description`

#### Scenario: Snapshot with all stages populated
- **WHEN** all five stages have been captured
- **THEN** the snapshot object contains keys `parsed`, `anonymised`, `sent`, `categorised`, and `restored`
- **THEN** no additional keys exist for parse sub-stages

#### Scenario: Parse sub-stages derived from parsed entry
- **WHEN** the inspector reads the `parsed` snapshot entry
- **THEN** it extracts Raw, After Clean, and After StripPII values from `RawTransaction` fields
- **THEN** no extra capture logic is needed in `page.tsx`

#### Scenario: Partial snapshot mid-pipeline
- **WHEN** only `parsed` and `anonymised` have been captured
- **THEN** the snapshot object contains only those two keys
- **THEN** `sent`, `categorised`, and `restored` are absent

### Requirement: Sent stage uses Gemini payload shape
The `sent` stage SHALL capture the array of objects passed to the Gemini API,
not `RawTransaction[]`. This accurately reflects what left the browser.

#### Scenario: Sent stage shape differs from other stages
- **WHEN** the `sent` stage is captured with the Gemini payload
- **THEN** each entry contains `index`, `payee`, `notes`, and `transactionType` fields
- **THEN** fields specific to `RawTransaction` (e.g. `originalPII`, `amount`) are absent

### Requirement: Snapshot is built immutably in handleCategorise
The `PipelineSnapshot` SHALL be built up by spreading new stage entries into
the existing snapshot state during `handleCategorise` in `page.tsx`.
Because the pipeline already returns new objects at each stage (no in-place
mutation), stage arrays MAY be stored by reference without defensive cloning.

#### Scenario: Snapshot grows through the pipeline
- **WHEN** `handleCategorise` runs to completion
- **THEN** the final snapshot state contains all five stage keys
- **THEN** each stage's array reflects the transaction state at that point in the pipeline

#### Scenario: Snapshot resets on new pipeline run
- **WHEN** `handleCategorise` is invoked again
- **THEN** the snapshot state is reset before new stages are captured
