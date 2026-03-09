## MODIFIED Requirements

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
