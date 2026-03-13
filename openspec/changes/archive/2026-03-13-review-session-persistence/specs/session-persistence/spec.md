## ADDED Requirements

### Requirement: Session state is persisted to localStorage
The system SHALL serialise the active review session (transactions, categoryMap, catStatus, and session metadata) to localStorage under the key `lunchprep_session` whenever review-step state changes, using a trailing debounce of ~1 second.

#### Scenario: State is saved after category edit
- **WHEN** the user changes a transaction's category on the review page
- **THEN** the system writes the updated session state to `localStorage["lunchprep_session"]` within ~1 second

#### Scenario: Debounced writes batch rapid edits
- **WHEN** the user edits a payee name by typing multiple characters in quick succession
- **THEN** only one write to localStorage occurs after the typing pauses for ~1 second

### Requirement: Session state is restored on page load
The system SHALL check for a saved session in `localStorage["lunchprep_session"]` on mount. If a valid session exists and the current step is "upload", the system SHALL display a resume banner. Date fields in `RawTransaction` SHALL be rehydrated from ISO 8601 strings back to `Date` objects.

#### Scenario: Valid session exists on page load
- **WHEN** the user loads the page and a valid `lunchprep_session` key exists in localStorage
- **THEN** the upload page displays a resume banner showing the original filename, transaction count, and relative time since save (e.g. "2 hours ago")

#### Scenario: No saved session
- **WHEN** the user loads the page and no `lunchprep_session` key exists in localStorage
- **THEN** the upload page renders normally with no resume banner

#### Scenario: Corrupt or version-mismatched session
- **WHEN** the user loads the page and `lunchprep_session` contains invalid JSON or a mismatched version
- **THEN** the system silently discards the stored value and renders the upload page normally

### Requirement: Resume restores full review state
When the user clicks "Resume" on the banner, the system SHALL hydrate `transactions`, `categoryMap` (from serialised entries array), and `catStatus` from the saved session, then set `step` to `"review"`.

#### Scenario: User clicks Resume
- **WHEN** the user clicks the "Resume" button on the saved session banner
- **THEN** the page transitions to step "review" with the persisted transactions, category assignments, and catStatus restored exactly as they were when saved

#### Scenario: Date fields are correctly rehydrated
- **WHEN** the session is restored
- **THEN** every `transaction.date` value is a `Date` object (not a string), and produces the same date string as the original

### Requirement: Discard clears the saved session
When the user clicks "Discard" on the resume banner, the system SHALL remove `lunchprep_session` from localStorage and remain on the upload page.

#### Scenario: User clicks Discard
- **WHEN** the user clicks the "Discard" button on the saved session banner
- **THEN** `localStorage["lunchprep_session"]` is removed and the upload page shows the normal file upload UI with no banner

### Requirement: Session is cleared on workflow completion
The system SHALL remove `lunchprep_session` from localStorage when the user completes the workflow via "Export complete" or resets via "Start Over".

#### Scenario: Export complete clears session
- **WHEN** the step transitions to "export" after a successful CSV download
- **THEN** `localStorage["lunchprep_session"]` is removed

#### Scenario: Start Over clears session
- **WHEN** the user clicks "Start Over" from the review or export page
- **THEN** `localStorage["lunchprep_session"]` is removed

### Requirement: New CSV upload replaces saved session
When the user uploads a new CSV file (whether from the upload page or after discarding a session), the system SHALL replace any existing saved session with the new data.

#### Scenario: Upload replaces existing session
- **WHEN** the user uploads a new CSV while a saved session exists in localStorage
- **THEN** the old session is replaced with the new transaction data after parsing and categorisation completes

### Requirement: Original filename is captured for session metadata
The system SHALL capture the uploaded file's name and include it in the saved session metadata so the resume banner can display it.

#### Scenario: Filename displayed in resume banner
- **WHEN** a saved session exists and the resume banner is shown
- **THEN** the banner displays the original CSV filename (e.g. "dbs_mar2026.csv")

### Requirement: localStorage quota errors degrade gracefully
If `localStorage.setItem` throws a quota error or any other storage exception, the system SHALL silently skip the write without crashing or showing an error to the user.

#### Scenario: Storage quota exceeded
- **WHEN** the browser's localStorage quota is exceeded during a write attempt
- **THEN** the system continues to function normally; the session is simply not persisted
