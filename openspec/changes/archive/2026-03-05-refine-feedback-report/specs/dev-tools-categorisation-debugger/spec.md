## MODIFIED Requirements

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
