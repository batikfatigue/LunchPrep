## ADDED Requirements

### Requirement: Transaction number jump input
The inspector header SHALL include a compact number input field that allows the user to jump directly to a transaction by its 1-indexed number. The input SHALL:
- Accept numeric values from 1 to `transactionCount` (inclusive).
- Navigate to the specified transaction (calling `onSelectIndex(number - 1)`) when the user presses Enter.
- Clamp out-of-range values to the valid range (values < 1 become 1, values > `transactionCount` become `transactionCount`).
- Clear/reset to the current transaction number if the user presses Escape.
- Be rendered inline in the inspector header, next to the transaction label.
- Be hidden when no transaction is selected or when sandbox mode is active.

#### Scenario: Jump to a valid transaction number
- **WHEN** the user types `15` into the jump input and presses Enter
- **WHEN** `transactionCount` is 50
- **THEN** `onSelectIndex` is called with `14` (0-indexed)
- **THEN** the inspector displays transaction #15's pipeline journey

#### Scenario: Jump input clamped to valid range (too high)
- **WHEN** the user types `999` into the jump input and presses Enter
- **WHEN** `transactionCount` is 50
- **THEN** `onSelectIndex` is called with `49` (last transaction, 0-indexed)

#### Scenario: Jump input clamped to valid range (too low)
- **WHEN** the user types `0` into the jump input and presses Enter
- **THEN** `onSelectIndex` is called with `0` (first transaction)

#### Scenario: Escape resets the jump input
- **WHEN** the user types a number into the jump input and presses Escape
- **THEN** the input value resets to the current `selectedIndex + 1`
- **THEN** the input loses focus, returning focus to the inspector panel

#### Scenario: Jump input hidden in sandbox mode
- **WHEN** sandbox mode is active
- **THEN** the jump input is not rendered

#### Scenario: Jump input hidden when no selection
- **WHEN** `selectedIndex` is null
- **THEN** the jump input is not rendered

### Requirement: Keyboard shortcut to cycle unreviewed transactions
The inspector SHALL support keyboard shortcuts for jumping to the next or previous unreviewed transaction. An "unreviewed" transaction is one that does not have an entry in the `reviewMap`, or has no review status assigned.

- `W` — jump to the next unreviewed transaction (wrapping from the end to the beginning).
- `Q` — jump to the previous unreviewed transaction (wrapping from the beginning to the end).

These shortcuts SHALL follow the same suppression rules as existing navigation shortcuts: disabled when `selectedIndex` is null, when sandbox mode is active, or when focus is inside a form input (textarea, input, select).

If no unreviewed transactions exist, the shortcut SHALL be a no-op.

#### Scenario: Jump to next unreviewed transaction
- **WHEN** the user presses `W`
- **WHEN** `selectedIndex` is 3 and transactions 4, 5 are reviewed but 6 is unreviewed
- **THEN** `onSelectIndex` is called with `6`

#### Scenario: Wrap around to find next unreviewed
- **WHEN** the user presses `W`
- **WHEN** `selectedIndex` is 48 (last is 49), transaction 49 is reviewed, and transaction 2 is unreviewed
- **THEN** `onSelectIndex` is called with `2` (wraps from end to beginning)

#### Scenario: Jump to previous unreviewed transaction
- **WHEN** the user presses `Q`
- **WHEN** `selectedIndex` is 10 and transactions 9, 8 are reviewed but 7 is unreviewed
- **THEN** `onSelectIndex` is called with `7`

#### Scenario: Wrap around to find previous unreviewed
- **WHEN** the user presses `Q`
- **WHEN** `selectedIndex` is 1, transaction 0 is reviewed, and transaction 45 is unreviewed
- **THEN** `onSelectIndex` is called with `45` (wraps from beginning to end)

#### Scenario: No unreviewed transactions exist
- **WHEN** the user presses `W` or `Q`
- **WHEN** all transactions have a review status (ok or flagged)
- **THEN** no navigation occurs (no-op)

#### Scenario: Shortcuts suppressed in form inputs
- **WHEN** focus is inside the annotation textarea or jump input
- **THEN** pressing `W` or `Q` does not trigger unreviewed navigation

### Requirement: Keyboard shortcut to cycle flagged transactions
The inspector SHALL support keyboard shortcuts for jumping to the next or previous flagged transaction. A "flagged" transaction is one with `status: "flagged"` in the `reviewMap`.

- `Shift+W` — jump to the next flagged transaction (wrapping from end to beginning).
- `Shift+Q` — jump to the previous flagged transaction (wrapping from beginning to end).

These shortcuts SHALL follow the same suppression rules as existing navigation shortcuts.

If no flagged transactions exist, the shortcut SHALL be a no-op.

#### Scenario: Jump to next flagged transaction
- **WHEN** the user presses `Shift+W`
- **WHEN** `selectedIndex` is 5 and transaction 12 is the next flagged transaction
- **THEN** `onSelectIndex` is called with `12`

#### Scenario: Wrap around to find next flagged
- **WHEN** the user presses `Shift+W`
- **WHEN** `selectedIndex` is 40, no flagged transactions exist after 40, but transaction 3 is flagged
- **THEN** `onSelectIndex` is called with `3`

#### Scenario: Jump to previous flagged transaction
- **WHEN** the user presses `Shift+Q`
- **WHEN** `selectedIndex` is 20 and transaction 8 is the previous flagged transaction
- **THEN** `onSelectIndex` is called with `8`

#### Scenario: No flagged transactions exist
- **WHEN** the user presses `Shift+W` or `Shift+Q`
- **WHEN** no transactions have `status: "flagged"` in the `reviewMap`
- **THEN** no navigation occurs (no-op)

### Requirement: Updated keyboard hint bar
The inspector header keyboard hint SHALL be updated to include the new shortcuts alongside the existing ones. The hint SHALL display:

`Q ‹ unrev · W unrev › · ⇧Q ‹ flag · ⇧W flag › · A ‹ prev · D next › · O ok · F flag · S summary`

The hint SHALL be hidden when sandbox mode is active (same as existing behavior).

#### Scenario: Full hint bar displayed
- **WHEN** the inspector has a selected transaction and sandbox is not active
- **THEN** the keyboard hint bar shows all shortcuts including the new Q/W/Shift+Q/Shift+W hints

#### Scenario: Hint bar hidden in sandbox
- **WHEN** sandbox mode is active
- **THEN** the keyboard hint bar is not rendered
