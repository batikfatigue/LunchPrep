## ADDED Requirements

### Requirement: Deterministic redaction of structured financial identifiers

The system SHALL regex-redact structured financial identifiers from transaction fields before any data is sent to an external API. Redaction SHALL apply to all transaction types (not just P2P). Redacted values SHALL be replaced with a placeholder string (e.g. `[REDACTED]`).

The following patterns MUST be redacted:
- Credit card numbers: 4×4 digit groups, usually delimited by dashes (e.g. `1234-5678-9012-3456`)
- Bank account numbers: sequences of 10+ consecutive digits
- NRIC/FIN patterns: `S`, `T`, `F`, or `G` followed by 7 digits and a letter (e.g. `S1234567A`)
- Phone numbers: 8-digit local patterns (e.g. `91234567`); if prefixed with `+65`, the following 8 digits SHALL be treated as a phone number. The `+65` prefix is not required for detection.
- Alphanumeric reference strings: sequences of mixed letters and digits exceeding a length threshold that match common reference formats (e.g. `qsb-sqr-sg-312515312312`, `M008488012930410564`)

#### Scenario: Credit card number in notes field
- **WHEN** a transaction's `notes` field contains `"Payment ref 1234-5678-9012-3456"`
- **THEN** the redacted output SHALL be `"Payment ref [REDACTED]"`

#### Scenario: NRIC in description field
- **WHEN** a transaction's `description` field contains `"Transfer to S1234567A"`
- **THEN** the redacted output SHALL be `"Transfer to [REDACTED]"`

#### Scenario: Phone number with +65 prefix
- **WHEN** a transaction's `notes` field contains `"+6591234567"`
- **THEN** the redacted output SHALL be `"[REDACTED]"`

#### Scenario: Phone number without prefix
- **WHEN** a transaction's `notes` field contains `"Call 91234567"`
- **THEN** the redacted output SHALL be `"Call [REDACTED]"`

#### Scenario: Alphanumeric reference string
- **WHEN** a transaction's `notes` field contains `"M008488012930410564"`
- **THEN** the redacted output SHALL be `"[REDACTED]"`

#### Scenario: Short alphanumeric strings are preserved
- **WHEN** a transaction's `notes` field contains `"rent aug"` or other natural language text
- **THEN** the text SHALL NOT be redacted

### Requirement: Redaction is independent of anonymisation pipeline

The redaction pre-filter SHALL run as a standalone step before anonymisation. It SHALL NOT depend on transaction type, channel classification, or any anonymisation decision. It SHALL apply to both `description` and `notes` fields.

#### Scenario: Non-P2P transaction with credit card in notes
- **WHEN** a POS transaction has `notes` containing `"Card ending 1234-5678-9012-3456"`
- **THEN** the credit card number SHALL be redacted even though POS transactions bypass anonymisation

#### Scenario: Redaction runs before anonymisation
- **WHEN** the pipeline processes a batch of transactions
- **THEN** redaction SHALL complete on all transactions before any anonymisation logic executes
