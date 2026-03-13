## MODIFIED Requirements

### Requirement: Keyboard navigation
The inspector SHALL support keyboard shortcuts for stepping through transactions. When the inspector panel has focus (and sandbox is not active):
- `A` or `←` — navigate to the previous transaction (calls `onSelectIndex(selectedIndex - 1)`)
- `D` or `→` — navigate to the next transaction (calls `onSelectIndex(selectedIndex + 1)`)
- `O` — toggle OK review status for the selected transaction
- `F` — toggle Flagged review status for the selected transaction
- `S` — toggle Flag Summary Overlay visibility
- `W` — jump to the next unreviewed transaction (wrapping)
- `Q` — jump to the previous unreviewed transaction (wrapping)
- `Shift+W` — jump to the next flagged transaction (wrapping)
- `Shift+Q` — jump to the previous flagged transaction (wrapping)

Navigation shortcuts are disabled when `selectedIndex` is null, at the boundary (index 0 for prev, `transactionCount - 1` for next). Shortcuts are suppressed when focus is inside a form input (textarea, input, select) to avoid conflicts with annotation entry.

Navigation updates the selected transaction in the main transaction table (via the `onSelectIndex` callback), keeping the table highlight in sync. A keyboard hint (`Q ‹ unrev · W unrev › · ⇧Q ‹ flag · ⇧W flag › · A ‹ prev · D next › · O ok · F flag · S summary`) is shown in the inspector header when not in sandbox mode. There are no clickable prev/next buttons — keyboard shortcuts are the sole navigation mechanism.

#### Scenario: Navigate to next transaction
- **WHEN** the user presses `D` or `→` and `selectedIndex` is less than `transactionCount - 1`
- **THEN** `onSelectIndex` is called with `selectedIndex + 1`
- **THEN** the inspector displays the next transaction's pipeline journey

#### Scenario: Navigate to previous transaction
- **WHEN** the user presses `A` or `←` and `selectedIndex` is greater than 0
- **THEN** `onSelectIndex` is called with `selectedIndex - 1`

#### Scenario: Next navigation ignored at last transaction
- **WHEN** `selectedIndex` equals `transactionCount - 1`
- **THEN** pressing `D` or `→` has no effect

#### Scenario: Prev navigation ignored at first transaction
- **WHEN** `selectedIndex` is 0
- **THEN** pressing `A` or `←` has no effect

#### Scenario: Navigation ignored when no selection
- **WHEN** `selectedIndex` is null
- **THEN** all navigation shortcuts have no effect

#### Scenario: Shortcuts suppressed in textarea
- **WHEN** focus is inside the annotation textarea
- **THEN** `A`, `D`, `←`, `→` key events are not intercepted by the inspector

#### Scenario: Jump to next unreviewed
- **WHEN** the user presses `W` and unreviewed transactions exist
- **THEN** `onSelectIndex` is called with the index of the next unreviewed transaction (wrapping)

#### Scenario: Jump to previous unreviewed
- **WHEN** the user presses `Q` and unreviewed transactions exist
- **THEN** `onSelectIndex` is called with the index of the previous unreviewed transaction (wrapping)

#### Scenario: Jump to next flagged
- **WHEN** the user presses `Shift+W` and flagged transactions exist
- **THEN** `onSelectIndex` is called with the index of the next flagged transaction (wrapping)

#### Scenario: Jump to previous flagged
- **WHEN** the user presses `Shift+Q` and flagged transactions exist
- **THEN** `onSelectIndex` is called with the index of the previous flagged transaction (wrapping)
