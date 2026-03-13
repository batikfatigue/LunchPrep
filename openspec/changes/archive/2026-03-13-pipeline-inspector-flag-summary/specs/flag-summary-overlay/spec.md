## ADDED Requirements

### Requirement: Toggle Flag Summary Overlay
The Pipeline Inspector SHALL provide a way to toggle a "Flag Summary Overlay" visibility. This SHALL be triggered by:
- Pressing the `S` key while the inspector panel has focus and an input is not targeted.

#### Scenario: Open overlay with keyboard
- **WHEN** the user presses `S` in the focused inspector
- **THEN** the Flag Summary Overlay is displayed

#### Scenario: Open overlay with keyboard
- **WHEN** the user presses `S` in the focused inspector
- **THEN** the Flag Summary Overlay is displayed

### Requirement: Display flagged transactions in a table
The Flag Summary Overlay SHALL display a table containing all transactions currently marked as "flagged" in the `reviewMap`. The table SHALL include columns for:
- **Index**: The 1-indexed transaction number (prefixed with #).
- **Raw Description**: The `originalDescription` from the raw transaction record.
- **Flag Note**: The manual annotation/note added by the user.

#### Scenario: Correct transactions displayed
- **WHEN** the overlay is opened
- **THEN** only transactions with `status === 'flagged'` appear in the list

### Requirement: Jump to transaction on click
Clicking a row in the summary table SHALL:
1.  Close the summary overlay.
2.  Update the `selectedIndex` to match the clicked transaction's index.
3.  Trigger the existing "scroll and focus" behavior for the selected transaction.

#### Scenario: Row clicked
- **WHEN** the user clicks a row for transaction #42
- **THEN** the overlay closes
- **THEN** the inspector updates to show transaction #42

### Requirement: Visual Dimensions and Esthetics
The overlay SHALL take up approximately 90% of the viewport width (up to a reasonable max-width) and 80% of the viewport height. It SHALL feature a dimmed, blurred backdrop to isolate it from the background transaction table.

#### Scenario: Modal dimensions
- **WHEN** the overlay is rendered
- **THEN** it is centered and occupies the majority of the screen
