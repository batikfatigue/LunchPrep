## ADDED Requirements

### Requirement: Channel-aware transaction classification

The system SHALL classify transactions by channel before anonymisation. Non-P2P transaction types (POS, MST, UMC, NETS, and all other non-transfer codes) SHALL bypass the anonymisation pipeline entirely — their payee names are always merchants and MUST be sent to Gemini unmasked.

P2P transaction types SHALL include codes whose full description maps to transfer/payment channels:
- `ICT` — "FAST or PayNow Payment / Receipt"
- `ITR` — "Funds Transfer"
- `ATR` — "Funds Transfer"
- `TRF` — "Funds Transfer"
- `TTR` — "Funds Transfer"
- `OTRF` — "Funds Transfer"

#### Scenario: POS transaction bypasses anonymisation
- **WHEN** a transaction has `transactionCode` "Point-of-Sale Transaction or Proceeds" (POS)
- **THEN** the payee description SHALL NOT be anonymised and SHALL be sent to Gemini as-is

#### Scenario: ICT transaction enters anonymisation pipeline
- **WHEN** a transaction has `transactionCode` "FAST or PayNow Payment / Receipt" (ICT)
- **THEN** the transaction SHALL enter the progressive unmasking pipeline with its payee defaulting to masked

#### Scenario: Additional fund transfer codes are recognised
- **WHEN** a transaction has `transactionCode` "Funds Transfer" (ATR, TRF, TTR, or OTRF)
- **THEN** the transaction SHALL be treated identically to ICT/ITR and enter the pipeline

### Requirement: P2P payees default to masked

All P2P transactions SHALL have their `description` field masked with a mock name by default. The system SHALL NOT use a keyword list to decide whether to mask. Every P2P payee starts masked; recovery levels determine whether to unmask.

The mock name assignment SHALL be deterministic: the same original name across multiple transactions SHALL receive the same mock name within a batch.

The `originalPII` field SHALL be populated with the mapping `{ mockName: originalName }` for all masked transactions, enabling restoration after categorisation.

#### Scenario: P2P transaction with merchant-like name is still masked
- **WHEN** a P2P (ICT) transaction has payee `"GRAB"`
- **THEN** the payee SHALL be masked with a mock name by default (recovery levels may later unmask it)

#### Scenario: P2P transaction with personal name is masked
- **WHEN** a P2P (ICT) transaction has payee `"TAN WEI MING"`
- **THEN** the payee SHALL be masked with a mock name

#### Scenario: Deterministic mock name assignment
- **WHEN** two P2P transactions both have payee `"ALICE WONG"`
- **THEN** both SHALL receive the same mock name

### Requirement: Level 1 — Notes-based AI classification

For masked P2P transactions, the system SHALL send the `notes` field and `transactionType` to Gemini for classification. The `description` (payee name) SHALL NOT be included in this call.

Gemini SHALL classify notes into one of three outcomes:

1. **Meaningful notes**: The notes contain enough context to categorise the transaction (e.g. `"birthday dinner"`, `"rent aug"`). The system SHALL categorise from notes alone. The payee stays masked.
2. **Reference number detected**: The notes contain a bill/payment reference number (e.g. `"INV-2024-001"`, `"M008488012930410564"`). This suggests a merchant payment. The transaction SHALL proceed to Level 2 for payee verification before unmasking.
3. **Empty or uninformative**: The notes provide no classification signal. The payee SHALL remain masked (safe default).

#### Scenario: Meaningful notes allow direct categorisation
- **WHEN** a masked P2P transaction has `notes` = `"birthday dinner"` and `transactionType` = `"FAST or PayNow Payment / Receipt"`
- **THEN** Gemini SHALL categorise the transaction from notes alone (e.g. "Dining")
- **AND** the payee SHALL remain masked

#### Scenario: Reference number triggers Level 2 verification
- **WHEN** a masked P2P transaction has `notes` = `"INV-2024-001"`
- **THEN** the transaction SHALL be flagged as "likely merchant"
- **AND** the transaction SHALL proceed to Level 2 syntax heuristics

#### Scenario: Empty notes keep payee masked
- **WHEN** a masked P2P transaction has `notes` = `""`
- **THEN** the payee SHALL remain masked
- **AND** the transaction SHALL be sent to Gemini for categorisation with the mock name

#### Scenario: Notes classification does not expose payee
- **WHEN** the system sends notes to Gemini for classification
- **THEN** the request SHALL contain only `notes` and `transactionType` fields
- **AND** the `description` (payee name) SHALL NOT be included

### Requirement: Level 2 — Syntax heuristics for merchant recovery

For P2P transactions flagged as "likely merchant" by Level 1, the system SHALL apply local syntax heuristics to the payee string before unmasking. This is a local-only check — no data is sent to Gemini at this stage.

Two pattern gates SHALL run:

**Positive gate (2.1)** — detect business patterns:
- Legal suffixes: `PTE LTD`, `PTE. LTD.`, `SDN BHD`, `LLC`, `INC`, `CORP`
- Business terms: `ENTERPRISE`, `HOLDINGS`, `SERVICES`
- Venue types: `CAFE`, `RESTAURANT`, `CLINIC`, `PHARMACY`
- If matched → unmask the payee

**Negative gate (2.2)** — detect personal name patterns:
- Malay name particles: `BIN`, `BINTE`
- Indian name particles: `S/O`, `D/O`
- General: 2–3 alphabetic words only (no numbers, no punctuation)
- If matched → keep masked

**Conflict resolution:**
- If positive gate matches AND negative gate does not → unmask
- If negative gate matches (regardless of positive gate) → keep masked
- If neither matches → keep masked (privacy-safe default)
- If both match → keep masked (privacy-safe default)

#### Scenario: Business suffix triggers unmask
- **WHEN** a likely-merchant P2P transaction has payee `"GRAB PTE LTD"`
- **THEN** the positive gate SHALL match
- **AND** the payee SHALL be unmasked and sent to Gemini for categorisation

#### Scenario: Personal name pattern keeps payee masked
- **WHEN** a likely-merchant P2P transaction has payee `"AHMAD BIN RASHID"`
- **THEN** the negative gate SHALL match on `BIN` particle
- **AND** the payee SHALL remain masked despite the merchant flag

#### Scenario: Ambiguous payee stays masked
- **WHEN** a likely-merchant P2P transaction has payee `"ECLIPSE"`
- **THEN** neither gate matches (no business suffix, no personal name pattern)
- **AND** the payee SHALL remain masked (safe default)

#### Scenario: Conflict defaults to masked
- **WHEN** a likely-merchant P2P transaction has payee `"LEE SERVICES"` (matches both business keyword and 2-word alphabetic name pattern)
- **THEN** the payee SHALL remain masked (privacy-safe default on conflict)

### Requirement: Restored names after categorisation

After Gemini categorisation is complete, the system SHALL restore original payee names using the `originalPII` mapping on each transaction. This behaviour SHALL remain unchanged from the current `restore()` function contract.

Transactions that were unmasked by the recovery pipeline (Levels 1–2) SHALL NOT have `originalPII` entries and SHALL pass through restoration unchanged.

#### Scenario: Masked transaction is restored after categorisation
- **WHEN** a transaction was masked with `description: "Alex Tan"` and `originalPII: { "Alex Tan": "REAL NAME" }`
- **THEN** after restoration, `description` SHALL be `"REAL NAME"`

#### Scenario: Unmasked merchant passes through restoration unchanged
- **WHEN** a transaction was unmasked by Level 2 with `description: "GRAB PTE LTD"` and `originalPII: {}`
- **THEN** after restoration, `description` SHALL remain `"GRAB PTE LTD"`
