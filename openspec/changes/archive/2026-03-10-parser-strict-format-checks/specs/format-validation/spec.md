## ADDED Requirements

### Requirement: Cleaners validate full format before processing
Each per-code cleaner function SHALL validate all relevant reference fields against the complete known pattern for each sub-type before executing any cleaning logic. If the fields do not match any known sub-type pattern, the cleaner MUST return `null`.

#### Scenario: POS transaction with valid format
- **WHEN** a POS transaction has ref1 matching `NETS QR PAYMENT <REF>` and ref2 matching `TO: <MERCHANT>`
- **THEN** the cleaner extracts the merchant from ref2 and returns cleaned payee and notes

#### Scenario: POS transaction with unexpected ref2 format
- **WHEN** a POS transaction has ref1 matching `NETS QR PAYMENT <REF>` but ref2 does not start with `TO: `
- **THEN** the cleaner returns `null`

#### Scenario: MST transaction with valid format
- **WHEN** a MST/UPI/UMC/UMC-S transaction has ref1 matching `<MERCHANT> [<MERCHANT-REF>] <ACQUIRER-CODE> <COUNTRY> <DATE>`
- **THEN** the cleaner extracts the merchant name and returns cleaned payee and notes

#### Scenario: MST transaction with no acquirer suffix
- **WHEN** a MST transaction has ref1 that does not contain an acquirer/country/date suffix
- **THEN** the cleaner returns `null`

#### Scenario: ICT PayNow outgoing with valid format
- **WHEN** an ICT transaction has ref1 matching `PayNow Transfer <REF>`, ref2 matching `To: <NAME>`, and ref3 matching `OTHR <NOTES>`
- **THEN** the cleaner extracts payee from ref2 and notes from ref3

#### Scenario: ICT PayNow outgoing with missing OTHR prefix in ref3
- **WHEN** an ICT transaction has ref1 matching `PayNow Transfer <REF>` and ref2 matching `To: <NAME>` but ref3 does not start with `OTHR`
- **THEN** the cleaner returns `null`

#### Scenario: ICT PayNow incoming with valid format
- **WHEN** an ICT transaction has ref1 matching `Incoming PayNow Ref <REF>`, ref2 matching `From: <NAME>`, and ref3 matching `OTHR <NOTES>`
- **THEN** the cleaner extracts payee from ref2 and notes from ref3

#### Scenario: ICT external bank outgoing with valid format
- **WHEN** an ICT transaction has ref1 matching `<BANK>:<ACCOUNT>:I-BANK`, ref2 containing user notes, and ref3 matching `OTHR <REF>`
- **THEN** the cleaner extracts bank name from ref1 and notes from ref2

#### Scenario: ICT with unrecognised ref1 pattern (including incoming external bank)
- **WHEN** an ICT transaction has ref1 that does not match any known ICT sub-type pattern (PayNow out, PayNow in, or external bank out)
- **THEN** the cleaner returns `null` (falls through to catch-all as "Unknown Format")

#### Scenario: ITR PayLah withdrawal with valid format
- **WHEN** an ITR transaction has ref1 starting with `SEND BACK FROM PAYLAH! :`
- **THEN** the cleaner returns payee `PayLah!` and notes `Received`

#### Scenario: ITR PayLah top-up with valid format
- **WHEN** an ITR transaction has ref1 starting with `TOP UP TO PAYLAH! :`
- **THEN** the cleaner returns payee `PayLah!` and notes `Top-Up`

#### Scenario: ITR outgoing DBS transfer with valid format
- **WHEN** an ITR transaction has ref1 equal to `DBS:I-BANK` and ref3 matching `OTHR <NOTES> <REF>`
- **THEN** the cleaner extracts notes from ref3 after stripping OTHR prefix and trailing reference

#### Scenario: ITR outgoing DBS transfer with ref3 missing OTHR prefix
- **WHEN** an ITR transaction has ref1 equal to `DBS:I-BANK` but ref3 does not start with `OTHR`
- **THEN** the cleaner returns `null`

#### Scenario: ITR incoming DBS transfer with valid format
- **WHEN** an ITR transaction has ref2 matching `<ACCOUNT>:IB`
- **THEN** the cleaner returns payee `Dbs` with empty notes

#### Scenario: ITR with unrecognised format
- **WHEN** an ITR transaction has ref1 that does not match any known ITR sub-type pattern
- **THEN** the cleaner returns `null`

### Requirement: Single catch-all fallback for unrecognised formats
The parser's main loop MUST apply a single catch-all fallback when any cleaner returns `null` or when the transaction code is unknown. The catch-all MUST set payee to `"Unknown Format"` and notes to `""`.

#### Scenario: Known code with unrecognised format hits catch-all
- **WHEN** a transaction has a known code (e.g. POS) but the cleaner returns `null` due to format mismatch
- **THEN** the transaction is recorded with payee `"Unknown Format"` and notes `""`

#### Scenario: Unknown transaction code hits catch-all
- **WHEN** a transaction has a code not handled by any cleaner (e.g. `"XYZ"`)
- **THEN** the transaction is recorded with payee `"Unknown Format"` and notes `""`

#### Scenario: Catch-all does not leak PII
- **WHEN** the catch-all is triggered for any reason
- **THEN** no raw reference field data, description, or other CSV content appears in payee or notes
