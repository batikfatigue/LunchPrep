## ADDED Requirements

### Requirement: Define parseTrace field on RawTransaction
`RawTransaction` SHALL include an optional `parseTrace` field typed as
`{ cleanedPayee: string }`. The field captures the payee value returned by
the per-code cleaner function (e.g. `cleanMST`, `cleanICT`) before
`stripPII()` is applied.

#### Scenario: parseTrace present in dev mode
- **WHEN** a transaction is parsed with `NEXT_PUBLIC_DEV_TOOLS === 'true'`
- **THEN** the resulting `RawTransaction` has `parseTrace.cleanedPayee` set to the per-code cleaner's payee output

#### Scenario: parseTrace absent in production
- **WHEN** a transaction is parsed with `NEXT_PUBLIC_DEV_TOOLS` unset or not `'true'`
- **THEN** the resulting `RawTransaction` has `parseTrace` as `undefined`

### Requirement: Populate parseTrace in DBS parser
The DBS parser SHALL capture `cleaned.payee` (the return value of the per-code
cleaner function) before calling `stripPII()`, and store it in
`parseTrace.cleanedPayee` on the resulting `RawTransaction`. Population
SHALL be gated behind `process.env.NEXT_PUBLIC_DEV_TOOLS === "true"`.

#### Scenario: MST transaction trace
- **WHEN** parsing an MST transaction where `cleanMST` returns payee `"Grab Transport 12345678"`
- **THEN** `parseTrace.cleanedPayee` is `"Grab Transport 12345678"`
- **THEN** `description` (after `stripPII`) may differ (e.g. `"Grab Transport"`)

#### Scenario: ICT transaction trace
- **WHEN** parsing an ICT PayNow transaction where `cleanICT` returns payee `"John Doe"`
- **THEN** `parseTrace.cleanedPayee` is `"John Doe"`
- **THEN** `description` equals `"John Doe"` (no card number to strip)

#### Scenario: Production build skips trace
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS` is not `'true'`
- **THEN** no `parseTrace` object is created on the transaction

### Requirement: parseTrace does not affect downstream pipeline
The `parseTrace` field SHALL NOT be read or modified by any downstream pipeline
stage (anonymiser, categoriser, exporter). It is consumed solely by the pipeline
inspector dev tool.

#### Scenario: Anonymiser ignores parseTrace
- **WHEN** `anonymise()` processes a transaction with `parseTrace` set
- **THEN** the output transaction preserves `parseTrace` unchanged (via object spread)

#### Scenario: Exporter ignores parseTrace
- **WHEN** `generateLunchMoneyCsv()` processes a transaction with `parseTrace` set
- **THEN** the CSV output contains no trace data
