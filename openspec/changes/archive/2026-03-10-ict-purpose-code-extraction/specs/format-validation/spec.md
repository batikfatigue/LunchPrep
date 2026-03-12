## MODIFIED Requirements

### Requirement: Cleaners validate full format before processing
Each per-code cleaner function SHALL validate all relevant reference fields against the complete known pattern for each sub-type before executing any cleaning logic. If the fields do not match any known sub-type pattern, the cleaner MUST return `null`.

#### Scenario: ICT outgoing interbank with valid 4-letter purpose code
- **WHEN** an ICT transaction has ref1 matching `<BANK>:<ACCOUNT>:I-BANK`, ref2 containing user notes, and ref3 matching `<4-ALPHA-CODE> <REF>`
- **THEN** the cleaner extracts bank name from ref1, resolves the purpose code, and builds notes from purpose label and ref2

#### Scenario: ICT outgoing interbank with INT purpose code (DBS exception)
- **WHEN** an ICT transaction has ref1 matching `<BANK>:<ACCOUNT>:I-BANK` and ref3 starting with `INT `
- **THEN** the cleaner accepts the 3-letter code as valid and resolves it to "Intra Company Payment"

#### Scenario: ICT outgoing interbank with invalid ref3 structure
- **WHEN** an ICT transaction has ref1 matching `<BANK>:<ACCOUNT>:I-BANK` but ref3 does not match `<4-ALPHA-CODE> <REF>` or `INT <REF>`
- **THEN** the cleaner returns `null`

## ADDED Requirements

### Requirement: Purpose code resolution for outgoing interbank ICT transactions
The cleaner SHALL extract the FAST purpose code from ref3 and resolve it to a human-readable label. Resolution follows a strict order: `INT` maps to "Intra Company Payment" (hardcoded DBS exception), `OTHR` is suppressed (null), known codes are resolved via `fast_purpose_codes.json` lookup, and unknown codes are suppressed with a `console.warn`.

#### Scenario: Known FAST purpose code is resolved
- **WHEN** the purpose code extracted from ref3 is a known code in `fast_purpose_codes.json` (e.g. `SALA`)
- **THEN** the resolved label (e.g. "Salary Payment") is used in notes

#### Scenario: OTHR purpose code is suppressed
- **WHEN** the purpose code extracted from ref3 is `OTHR`
- **THEN** no purpose label is appended to notes (treated as default with no user intent)

#### Scenario: INT purpose code is resolved as DBS exception
- **WHEN** the purpose code extracted from ref3 is `INT`
- **THEN** it resolves to "Intra Company Payment" without a JSON lookup

#### Scenario: Unknown purpose code is suppressed with warning
- **WHEN** the purpose code extracted from ref3 is not `INT`, not `OTHR`, and not found in `fast_purpose_codes.json`
- **THEN** no purpose label is appended to notes and a `console.warn` is emitted with the unknown code

### Requirement: Notes consolidation for outgoing interbank ICT transactions
The cleaner SHALL build the notes field by combining the resolved purpose label (if any) with the ref2 user notes, using purpose-first pipe-delimited format.

#### Scenario: Both purpose label and ref2 notes present
- **WHEN** purpose code resolves to a label and ref2 contains user notes
- **THEN** notes are formatted as `"<Purpose Label> | <ref2 notes>"`

#### Scenario: Only purpose label present
- **WHEN** purpose code resolves to a label and ref2 is empty
- **THEN** notes are the purpose label only (e.g. `"Salary Payment"`)

#### Scenario: Only ref2 notes present (purpose suppressed)
- **WHEN** purpose code is suppressed (OTHR, unknown) and ref2 contains user notes
- **THEN** notes are the ref2 content only

#### Scenario: Neither purpose label nor ref2 notes
- **WHEN** purpose code is suppressed and ref2 is empty
- **THEN** notes are an empty string
