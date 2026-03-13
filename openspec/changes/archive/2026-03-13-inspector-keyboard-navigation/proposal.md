## Why

Reviewing transactions in the pipeline inspector currently requires sequential A/D stepping or clicking rows in the table. When reviewing 50+ transactions, there's no way to jump directly to a specific transaction by number, or quickly cycle through only flagged or unreviewed items. This makes the review workflow slow and tedious — especially when resuming a partially-completed review session or re-visiting flagged items for editing.

## What Changes

- **Transaction number jump**: A compact input field in the inspector header that accepts a transaction number (1-indexed) and immediately navigates to it on Enter.
- **Jump to next/previous unreviewed**: Keyboard shortcuts (`W`/`Q`) to skip directly to the next or previous transaction that has no review status (not OK, not flagged, not neutral).
- **Jump to next/previous flagged**: Keyboard shortcuts (`Shift+W`/`Shift+Q`) to skip directly to the next or previous flagged transaction.
- **Updated keyboard hint**: The inspector header hint bar updated to show all new shortcuts alongside existing ones.

## Capabilities

### New Capabilities
- `dev-tools-inspector-jump-navigation`: Direct transaction jump (by number input) and keyboard shortcuts for cycling through unreviewed and flagged subsets.

### Modified Capabilities
- `pipeline-inspector`: The keyboard navigation requirement is extended with new shortcuts (W/Q for unreviewed, Shift+W/Shift+Q for flagged). The inspector header gains a jump input.

## Impact

- **Code**: `src/dev-tools/pipeline-inspector/index.tsx` (header UI, keydown handler), likely a new sub-component for the jump input.
- **Props**: No new props required — `reviewMap` (internal state), `transactionCount`, and `onSelectIndex` already provide everything needed.
- **Dependencies**: No new dependencies.
- **Tests**: New test file for jump navigation logic; updates to existing keyboard-nav tests for new shortcuts.
