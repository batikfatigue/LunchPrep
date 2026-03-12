## ADDED Requirements

### Requirement: Transaction review states
Each transaction SHALL have one of four review states:
- **unreviewed** (default): not present in the state map
- **OK**: actively reviewed, no issues
- **flagged**: actively reviewed, has a developer note
- **neutral**: has a developer note but no active OK/flagged status (entered by toggling off a button when a note is present)

The inspector SHALL maintain review state as a `Map<number, ReviewStatus>` in component state. Transactions not present in the map are unreviewed.

#### Scenario: Initial state
- **WHEN** the inspector is rendered after a categorisation run
- **THEN** all transactions start as unreviewed

#### Scenario: Mark as OK
- **WHEN** the user clicks the OK button for the selected transaction
- **THEN** the transaction's review state changes to OK
- **THEN** the progress counter increments

#### Scenario: Mark as flagged
- **WHEN** the user clicks the Flag button for the selected transaction
- **THEN** the transaction's review state changes to flagged
- **THEN** a note textarea is shown for that transaction
- **THEN** the progress counter increments

#### Scenario: Change from OK to flagged
- **WHEN** the user clicks Flag on a transaction previously marked OK
- **THEN** the review state changes to flagged with a note textarea

#### Scenario: Change from flagged to OK
- **WHEN** the user clicks OK on a transaction previously marked flagged
- **THEN** the review state changes to OK and any existing note is preserved

#### Scenario: Toggle off OK — no note → unreviewed
- **WHEN** the user clicks OK on a transaction already marked OK and no note is present
- **THEN** the transaction returns to unreviewed (entry removed from map)

#### Scenario: Toggle off OK — has note → neutral
- **WHEN** the user clicks OK on a transaction already marked OK and a note is present
- **THEN** the transaction enters neutral state (note preserved, no active status)
- **THEN** the progress counter decrements (neutral does not count as reviewed)

#### Scenario: Toggle off Flag — no note → unreviewed
- **WHEN** the user clicks Flag on a transaction already marked flagged and no note is present
- **THEN** the transaction returns to unreviewed (entry removed from map)

#### Scenario: Toggle off Flag — has note → neutral
- **WHEN** the user clicks Flag on a transaction already marked flagged and a note is present
- **THEN** the transaction enters neutral state (note preserved, no active status)
- **THEN** the progress counter decrements (neutral does not count as reviewed)

### Requirement: Review controls section
The inspector SHALL render a review controls section below the API Result Panel. The section SHALL contain:
- **OK button**: Marks the transaction as reviewed with no issues
- **Flag button**: Marks the transaction as flagged and shows a note textarea
- **Progress counter**: Displays "X/Y reviewed · N ok · N flagged" where X is the count of OK + flagged transactions (neutral does not count), Y is the total transaction count, and the breakdown shows the ok and flagged subtotals separately. Neutral-state transactions are not counted toward the reviewed total.
- **Export button**: Downloads a Markdown report of flagged items

The review controls section SHALL visually indicate the current review state of the selected transaction (e.g. highlight the active button).

#### Scenario: Review controls rendered for real transaction
- **WHEN** a real transaction is selected and categorisation has completed
- **THEN** the review controls section is visible below the API Result Panel

#### Scenario: Review controls hidden when sandbox active
- **WHEN** sandbox data is active
- **THEN** the review controls section is not rendered

#### Scenario: Review controls hidden before categorisation
- **WHEN** no categorisation has been run (categoryMap is empty)
- **THEN** the review controls section is not rendered

#### Scenario: Progress counter accuracy
- **WHEN** 5 transactions are marked OK and 3 are flagged out of 47 total
- **THEN** the progress counter displays "8/47 reviewed"

### Requirement: Flagged transaction note
The review controls section SHALL always display a note textarea. The textarea SHALL be enabled only when the transaction is flagged; it SHALL be visually greyed out (disabled) in all other states (unreviewed, OK, neutral). The note SHALL be preserved when navigating away and back to the same transaction (within the same session). The note SHALL be included in the Markdown export.

#### Scenario: Note textarea always visible
- **WHEN** the review controls section is rendered
- **THEN** a textarea is always displayed, regardless of the current review state

#### Scenario: Note textarea enabled when flagged
- **WHEN** a transaction is flagged
- **THEN** the textarea is enabled and accepts input

#### Scenario: Note textarea disabled when not flagged
- **WHEN** a transaction is unreviewed, OK, or neutral
- **THEN** the textarea is visible but disabled (greyed out)

#### Scenario: Note preserved during navigation
- **WHEN** a transaction is flagged with a note, then the user navigates to another transaction and back
- **THEN** the note is still present

#### Scenario: Note preserved on state change to OK
- **WHEN** a flagged transaction with a note is changed to OK
- **THEN** the note is preserved (visible in the disabled textarea)

### Requirement: Markdown export of flagged items
The export function SHALL compile only flagged transactions (those with review state "flagged") into a Markdown file and trigger a browser download. Transactions with OK or unreviewed status SHALL be excluded.

Each flagged transaction entry SHALL include:
- Developer note (first)
- Metadata table: Date, Raw Description, Amount, Transaction Code, Assigned Category, Notes
- API Payload as fenced JSON code block (or "N/A" if unavailable)
- API Output as fenced JSON code block
- AI Reasoning as blockquote (or "N/A" if unavailable)

#### Scenario: Export with flagged items
- **WHEN** the user clicks Export and flagged transactions exist
- **THEN** a Markdown file is downloaded containing only flagged transaction entries with developer notes

#### Scenario: Export with no flagged items
- **WHEN** the user clicks Export but no transactions are flagged
- **THEN** a Markdown file is downloaded containing only the header and a notice that no items were flagged

#### Scenario: Export field ordering
- **WHEN** a flagged transaction is included in the export
- **THEN** the developer note appears first, followed by metadata table, API payload, API output, and AI reasoning

### Requirement: Review state is ephemeral
Review state SHALL be stored in React component state. It SHALL NOT persist across page refreshes or new CSV uploads. When a new categorisation run occurs (snapshots reset), review state SHALL be cleared.

#### Scenario: State lost on page refresh
- **WHEN** the user refreshes the page after marking transactions as OK or flagged
- **THEN** all review states are reset to unreviewed

#### Scenario: State cleared on new categorisation run
- **WHEN** a new categorisation run begins (snapshots reset)
- **THEN** all review states are cleared
