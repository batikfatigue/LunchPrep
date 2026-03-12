> **RETIRED** — The categorisation debugger was deleted as part of the
> `dev-tools-merge-debugger-into-inspector` change (2026-03-12). All capabilities
> (category display, reasoning, API payload, annotations, Markdown export) are now
> provided by the pipeline inspector's API Result Panel and review workflow.
> See `openspec/specs/pipeline-inspector/spec.md` and
> `openspec/specs/dev-tools-review-workflow/spec.md`.

## ADDED Requirements

### Requirement: Dev-tools directory and environment boundary adherence
The categorisation debugger annotation component SHALL reside entirely within `src/dev-tools/` and MUST adhere to the existing dev-tools architecture. It MUST be guarded by the `NEXT_PUBLIC_DEV_TOOLS` environment variable and excluded from production bundles.

#### Scenario: Categorisation debugger dev-tool placement
- **WHEN** the `dev-tools-categorisation-debugger` is implemented
- **THEN** its code is placed under `src/dev-tools/` and is only imported dynamically via the established dev-tools registry/shell or a guarded dev-tool portal.

#### Scenario: Production exclusion of debugging data
- **WHEN** the system is running in production (where `NEXT_PUBLIC_DEV_TOOLS` is not 'true')
- **THEN** the API request to Gemini SHALL NOT request reasoning (to mitigate cost/latency), and the categorisation debugger dev-tool SHALL NOT be present in the build or DOM.

### Requirement: Conditional API inclusion of reasoning
The Gemini categorization logic SHALL conditionally request and return the LLM's full thought process based on whether the dev-tools environment variable is active.

#### Scenario: Fetching transaction reasoning in development
- **WHEN** `NEXT_PUBLIC_DEV_TOOLS` is set to 'true'
- **THEN** the backend process categorizing transactions requests the LLM to provide its chain-of-thought/reasoning and returns the raw API payload alongside the final categorization.

### Requirement: Interactive transaction annotation UI
The component SHALL provide a button on the review page to enter an overlay with a table. Since row clicks are already used for inputs on the main review page, this separate overlay is required. Inside the overlay table, each transaction row SHALL display the Date, Amount, Raw transaction description, a row-specific extracted API Payload (`{ payee, notes, transactionType }`), Gemini's Reasoning, and a row-specific API Output (`{ category }`). The row SHALL expand when clicked (and collapse when clicked again) to reveal an interactive comment section with a text area for the user to type their annotations. The expanded view MUST NOT contain any other data besides the comment box.

#### Scenario: Opening the review overlay
- **WHEN** the user clicks the devtool categorisation debugger button on the review page
- **THEN** an overlay emerges containing a table that displays the extensive API payload/reasoning data.

#### Scenario: Expanding a row for comments
- **WHEN** the user clicks a transaction row within the overlay table
- **THEN** an interactive comment section expands for that row, providing a text area for annotations.

#### Scenario: Closing the review overlay
- **WHEN** the user dismisses or closes the overlay
- **THEN** the overlay is hidden, preserving the typed comments in state.

### Requirement: Annotation export functionality
The dev-tool SHALL aggregate only transactions that have a non-empty developer note (annotation), their associated debugging data, and the developer's notes, enabling the user to export them as a compiled Markdown file. Transactions without annotations SHALL be excluded from the export. The term "Annotation" SHALL be renamed to "Developer Note" throughout the export output.

#### Scenario: Generating the review markdown with flagged items only
- **WHEN** the user triggers the export action in the dev-tool
- **THEN** the system generates a `.md` file containing only transactions that have a non-empty developer note, and initiates a file download for offline analysis.

#### Scenario: Generating an empty review when no items are flagged
- **WHEN** the user triggers the export action but no transactions have developer notes
- **THEN** the system generates a `.md` file containing only the report header and a notice that no items were flagged.

#### Scenario: Per-transaction field ordering in the export
- **WHEN** a flagged transaction is included in the exported markdown
- **THEN** the Developer Note SHALL appear first, followed by a metadata table containing: Date, Raw Description, Amount, Transaction Code, Assigned Category, and Notes; then the API Payload and API Output as fenced JSON code blocks; then the AI Reasoning as a blockquote.

#### Scenario: Raw API Payload section removal
- **WHEN** the review markdown is generated
- **THEN** the output SHALL NOT contain a "Raw API Payload" section with the full batch JSON payload.

#### Scenario: Markdown formatting quality
- **WHEN** the review markdown is generated
- **THEN** the output SHALL use Markdown tables for key-value metadata, fenced code blocks for JSON data, blockquotes for AI reasoning, and horizontal rules as section separators.

### Requirement: Paginated debugger table
The categorisation debugger table SHALL support pagination to handle large numbers of transactions efficiently, displaying a maximum of 25 transactions per page.

#### Scenario: Navigating between pages
- **WHEN** more than 25 transactions are provided to the debugger
- **THEN** the table displays only the first 25 items, and provides "Previous" and "Next" controls to navigate the full list.

#### Scenario: Pagination state reset
- **WHEN** the input transactions change (e.g., a new file is uploaded)
- **THEN** the debugger pagination SHALL reset to the first page.
