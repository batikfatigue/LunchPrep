## Why

The transaction review table currently renders all rows at once, which becomes unwieldy when processing large bank CSV files (100+ transactions). Scrolling through a long list makes it hard to review and edit categories systematically. Adding pagination with 25 rows per page improves usability and keeps the review workflow focused.

## What Changes

- Add client-side pagination to the `TransactionTable` component, displaying 25 transactions per page.
- Add left/right arrow navigation buttons with boundary guards (left disabled on first page, right disabled on last page).
- Add a page number input field allowing users to jump directly to a specific page.
- Show current page indicator (e.g. "Page 1 of 4").
- Summary footer continues to reflect **all** transactions, not just the current page.

## Capabilities

### New Capabilities
- `review-table-pagination`: Client-side pagination for the transaction review table with configurable page size, arrow navigation, and direct page jump input.

### Modified Capabilities
_(none)_

## Impact

- **Code:** `src/components/transaction-table.tsx` — primary change target. Pagination state and slicing logic added. Navigation bar rendered below the table.
- **Parent page:** `src/app/page.tsx` — no changes expected; `categoryMap` indexing already uses absolute transaction indices.
- **Tests:** `tests/components/transaction-table.test.ts` — new test cases for pagination helpers.
- **Dependencies:** None — pure client-side React state, no new packages.
