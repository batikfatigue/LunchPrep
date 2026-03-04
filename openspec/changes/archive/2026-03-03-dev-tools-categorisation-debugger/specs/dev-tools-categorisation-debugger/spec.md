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
The dev-tool SHALL aggregate all reviewed transactions, their associated debugging data, and the user's comments, enabling the user to export them as a compiled Markdown file.

#### Scenario: Generating the review markdown
- **WHEN** the user completes their visual review and triggers the export action in the dev-tool
- **THEN** the system generates a `.md` file formatted with the raw data, Gemini responses, and the user's manual annotations, and initiates a file download for offline analysis.
