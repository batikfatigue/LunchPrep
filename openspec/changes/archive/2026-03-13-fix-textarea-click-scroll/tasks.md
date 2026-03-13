## 1. EditableCell click isolation

- [x] 1.1 Add `e.stopPropagation()` to the EditableCell display span's click handler so entering edit mode does not bubble to the row
- [x] 1.2 Add `e.stopPropagation()` to the EditableCell input's `onClick` (or wrapping element) so clicks inside the active input do not bubble to the row

## 2. Blur-then-click suppression

- [x] 2.1 Add a ref (`editJustEndedRef`) at the `TransactionRow` (or table) level to track when an EditableCell input has just blurred
- [x] 2.2 On EditableCell input blur, set the ref to `true` and schedule a `setTimeout(0)` to reset it to `false`
- [x] 2.3 In the `<tr onClick>` handler, skip calling `onRowSelect` when `editJustEndedRef.current` is `true`

## 3. Tests

- [x] 3.1 Add test: clicking an EditableCell to enter edit mode does not call `onRowSelect`
- [x] 3.2 Add test: clicking inside an active EditableCell input does not call `onRowSelect`
- [x] 3.3 Add test: clicking the row after an EditableCell blur (within the same frame) does not call `onRowSelect`
- [x] 3.4 Add test: clicking the row when no EditableCell is editing calls `onRowSelect` normally
- [x] 3.5 Run existing pipeline-inspector keyboard-nav tests to confirm no regressions
