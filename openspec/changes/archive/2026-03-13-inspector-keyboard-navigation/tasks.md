## 1. Navigation Helper Functions

- [x] 1.1 Create `src/dev-tools/pipeline-inspector/navigation-helpers.ts` with pure functions: `findNextUnreviewed(currentIndex, transactionCount, reviewMap)`, `findPrevUnreviewed(...)`, `findNextFlagged(...)`, `findPrevFlagged(...)` — all returning `number | null` with wrap-around logic
- [x] 1.2 Write unit tests for navigation helpers covering: forward/backward search, wrap-around, no matches (returns null), all reviewed, single match, current index is a match (skip to next)

## 2. Jump Input Component

- [x] 2.1 Create `src/dev-tools/pipeline-inspector/jump-input.tsx` — compact number input accepting 1-indexed transaction number, navigates on Enter, resets on Escape, clamping to valid range
- [x] 2.2 Write unit tests for jump input: valid input, out-of-range clamping, Escape reset, hidden in sandbox mode, hidden when no selection

## 3. Keyboard Shortcut Integration

- [x] 3.1 Extend `handlePanelKeyDown` in `index.tsx` to handle `W`/`Q` (unreviewed navigation) and `Shift+W`/`Shift+Q` (flagged navigation) using the navigation helper functions
- [x] 3.2 Update keyboard hint bar text to include new shortcuts: `Q ‹ unrev · W unrev › · ⇧Q ‹ flag · ⇧W flag ›`
- [x] 3.3 Update existing keyboard-nav tests to cover new W/Q/Shift+W/Shift+Q shortcuts, including suppression in form inputs and sandbox mode

## 4. Header UI Integration

- [x] 4.1 Integrate `JumpInput` component into the inspector header in `index.tsx`, positioned next to the transaction label
- [x] 4.2 Verify `index.tsx` stays under 500 lines after changes; refactor if needed

## 5. Verification

- [x] 5.1 Run full test suite (`npm test`) and fix any failures
- [x] 5.2 Run production build (`npm run build`) to verify dev-tool isolation — no static imports from `src/dev-tools/` in production code
