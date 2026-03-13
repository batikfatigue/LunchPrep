## Why

Clicking on the payee or notes field in a transaction row triggers the inspector scroll-into-view behaviour, making inline editing frustrating — the page jumps on the first click before the user can even start typing. The scroll should only happen for intentional row selection, not when interacting with editable fields.

## What Changes

- Prevent clicks on `EditableCell` inputs (payee/notes) from propagating to the row's `onRowSelect` handler, so the inspector does not scroll into view.
- After an edit is committed (blur), suppress the immediate row click that caused the blur — the user clicked to dismiss the input, not to re-select the row. A subsequent deliberate click on the row will scroll the inspector into view as normal.

## Capabilities

### New Capabilities

_None — this is a behavioural fix to existing interaction._

### Modified Capabilities

- `pipeline-inspector`: The row-click → scroll-into-view contract gains an exception: clicks originating from editable cells (or clicks that cause an editable cell to blur) must not trigger the scroll.

## Impact

- `src/components/transaction-table.tsx` — `EditableCell` click/blur handling, row `onClick` guard.
- `src/dev-tools/pipeline-inspector/index.tsx` — potentially the scroll-into-view effect if a flag-based approach is used.
- Existing keyboard-nav and inspector tests should remain green; new tests needed for the click-suppression logic.
