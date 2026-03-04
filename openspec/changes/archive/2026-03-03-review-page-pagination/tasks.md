## 1. Backend Modifications

- [x] 1.1 Add `PAGE_SIZE` constant (25) and pagination state (`currentPage`) to `TransactionTable`
- [x] 1.2 Compute `totalPages`, `startIndex`, `endIndex` and slice `transactions` for the current page
- [x] 1.3 Map sliced rows with absolute index (`startIndex + localIndex`) for all callbacks (`onCategoryChange`, `onPayeeChange`, `onNotesChange`) and `categoryMap` lookups
- [x] 1.4 Add `useEffect` to reset `currentPage` to 0 when `transactions.length` changes

## 2. Pagination UI Controls

- [x] 2.1 Render a pagination bar below the table with left arrow, page input, "of N" label, and right arrow
- [x] 2.2 Disable left arrow button when on the first page
- [x] 2.3 Disable right arrow button when on the last page
- [x] 2.4 Implement controlled `<input type="number">` for page jump, clamped to `[1, totalPages]` on blur/Enter
- [x] 2.5 Hide pagination bar when there are 0 transactions or only 1 page
- [x] 2.7 Remove the stepper control on the page input
- [x] 2.8 Make the pagination bar proportionate the the size of the table
- [x] 2.9 Add a 'No.' column to the transaction table to display the transaction number

## 3. Testing

- [x] 3.1 Add unit tests for pagination helpers (total pages calculation, index mapping, clamping)
- [x] 3.2 Verify existing `computeSummary` and `formatAmount` tests still pass
