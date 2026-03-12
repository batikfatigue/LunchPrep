## MODIFIED Requirements

### Requirement: API Result Panel
When the sandbox runs in Full Pipeline mode, the API Result Panel SHALL be displayed below the stage diff table showing:
- **Category**: The category assigned by Gemini for the sandbox transaction
- **Reasoning** (collapsible, expanded by default): Gemini's chain-of-thought reasoning for the sandbox transaction
- **API Payload** (collapsible, expanded by default): The per-transaction JSON sent to Gemini, with the internal `index` field removed

The panel SHALL NOT be shown when running in Parse + Anonymise mode. The panel SHALL NOT be shown for real (non-sandbox) transaction inspections (the real transaction panel is handled by the pipeline-inspector spec).

#### Scenario: Full API Result Panel after Full Pipeline
- **WHEN** Full Pipeline execution completes successfully and debug data is available
- **THEN** the API Result Panel shows category, and collapsible reasoning and API payload sections

#### Scenario: Category only when debug data unavailable
- **WHEN** Full Pipeline execution completes but debug data is not available (BYOK mode)
- **THEN** the API Result Panel shows only the category
- **THEN** reasoning and API payload sections indicate "Not available (BYOK mode)"

#### Scenario: Panel hidden in Parse + Anonymise mode
- **WHEN** the sandbox runs in Parse + Anonymise mode
- **THEN** no API Result Panel is rendered

#### Scenario: Panel hidden for real transactions
- **WHEN** a real transaction is selected (not sandbox)
- **THEN** the sandbox API Result Panel is not rendered

### Requirement: Pipeline execution is self-contained
The sandbox SHALL execute the pipeline internally by importing `dbsParser`, `anonymise`, `restore`, and `callCategorise` directly. It SHALL build its own `PipelineSnapshot` from the execution results. It SHALL NOT call back into `page.tsx`'s `triggerCategorise`.

When running in Full Pipeline mode, the sandbox SHALL capture the `debug` field from the `callCategorise` response and include it in the `SandboxResult` as `debugData`.

Categories and API key SHALL be received as props from the page via the inspector component.

#### Scenario: Sandbox builds its own snapshot
- **WHEN** the sandbox executes
- **THEN** it constructs a `PipelineSnapshot` from the pipeline function results
- **THEN** the stage diff table renders from this sandbox-built snapshot

#### Scenario: Sandbox captures debug data in Full Pipeline mode
- **WHEN** the sandbox executes in Full Pipeline mode
- **THEN** the `SandboxResult` includes `debugData` from the `callCategorise` response

#### Scenario: Categories and API key are passed as props
- **WHEN** the inspector is rendered on the page
- **THEN** it receives `categories` and `apiKey` from page-level state
