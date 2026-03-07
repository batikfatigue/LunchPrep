## 1. State & Logic

- [x] 1.1 Add `PAGE_SIZE = 25` constant to `src/dev-tools/categorisation-debugger/index.tsx`.
- [x] 1.2 Implement `currentPage` state in `ReviewOverlay`.
- [x] 1.3 Add a `useEffect` to reset `currentPage` to 0 when the `transactions` prop changes.

## 2. UI Implementation

- [x] 2.1 Define inline styles for pagination controls in the `S` object (consistent with existing dev tool buttons).
- [x] 2.2 Add Previous/Next buttons and a page indicator to the `ReviewOverlay` header.
- [x] 2.3 Apply slicing logic to the `transactions` array passed to `ReviewTable` (or inside `ReviewTable`).

## 3. Verification

- [x] 3.1 Open categorization debugger with >25 transactions and verify that only the first 25 are shown.
- [x] 3.2 Verify that the "Next" button advances the page and "Previous" returns to the former page.
- [x] 3.3 Verify that uploading a new file resets the debugger to page 1.
- [x] 3.4 **Mandatory**: Verify that the changes are isolated from production code (e.g., `npm run build` or verifying gated imports).
