## MODIFIED Requirements

### Requirement: Scroll and focus inspector on external selection
When the selected transaction changes due to an external action (e.g. the user clicks a row in the transaction table) and sandbox is not active, the inspector panel SHALL scroll smoothly into view and receive focus. Scrolling and focus-stealing are skipped when the selection change originates from the inspector's own keyboard shortcuts (A/D/←/→), since the panel is already in view and focused during internal navigation.

The inspector SHALL NOT scroll into view when the row click originates from interaction with an `EditableCell` (payee or notes inline editing). Specifically:
- Clicking an `EditableCell` to enter edit mode SHALL NOT trigger scroll.
- Clicking within an active `EditableCell` input SHALL NOT trigger scroll.
- Clicking elsewhere on the row to blur (dismiss) an active `EditableCell` SHALL NOT trigger scroll. The edit is committed, the input is dismissed, but the inspector remains in its current scroll position.
- A subsequent deliberate click on the same row, when no `EditableCell` is in edit mode, SHALL trigger the normal scroll-into-view and focus behaviour.

#### Scenario: Scroll and focus on external row click
- **WHEN** the user clicks a transaction row in the main table (not on an EditableCell)
- **THEN** the inspector panel scrolls smoothly into view
- **THEN** the inspector panel receives focus to enable immediate keyboard shortcuts

#### Scenario: No scroll or focus-steal on internal keyboard navigation
- **WHEN** the user presses A/D/←/→ to navigate within the inspector
- **THEN** the inspector panel does not scroll or trigger an unnecessary focus call (it is already in view and focused)

#### Scenario: No scroll when clicking EditableCell to edit
- **WHEN** the user clicks on a payee or notes EditableCell to enter edit mode
- **THEN** the EditableCell enters edit mode (shows input)
- **THEN** the inspector does NOT scroll into view

#### Scenario: No scroll when clicking inside active EditableCell input
- **WHEN** the user clicks within an already-active EditableCell input
- **THEN** the input retains focus for continued editing
- **THEN** the inspector does NOT scroll into view

#### Scenario: No scroll when dismissing EditableCell by clicking row
- **WHEN** the user clicks elsewhere on the transaction row to blur an active EditableCell
- **THEN** the EditableCell commits the edit and exits edit mode
- **THEN** the inspector does NOT scroll into view

#### Scenario: Scroll resumes after editing is fully dismissed
- **WHEN** no EditableCell is in edit mode
- **WHEN** the user clicks the transaction row
- **THEN** the inspector scrolls smoothly into view and receives focus
