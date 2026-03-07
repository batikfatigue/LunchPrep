## Context

The `TransactionTable` component (`src/components/transaction-table.tsx`) currently renders every transaction in a single `<tbody>`. For small CSVs (< 30 rows) this is fine, but DBS monthly statements can contain 100+ rows, making the review page unwieldy. The parent page (`src/app/page.tsx`) passes the full `transactions` array and a `categoryMap` keyed by absolute index.

## Goals / Non-Goals

**Goals:**
- Paginate the transaction table to 25 rows per page.
- Provide left/right arrow buttons with boundary-aware disabling.
- Allow jumping to a specific page via a numeric input field.
- Keep the summary footer reflecting **all** transactions, not just the visible page.
- Add a 'No.' column to the transaction table to display the transaction number

**Non-Goals:**
- Server-side pagination (all data is already client-side).
- Configurable page size (hardcode at 25; can be extracted later).
- Persisting the current page across step changes or reloads.
- Sorting or filtering (separate feature).

## Decisions

### 1. Pagination state lives inside `TransactionTable`
**Rationale:** The parent page doesn't need to know the current page. Keeping `currentPage` as local `useState` in `TransactionTable` avoids prop-threading and keeps the change self-contained.

**Alternative considered:** Lifting state to the parent — rejected because no other component needs the page index.

### 2. Slice `transactions` before mapping rows
**Rationale:** Use `transactions.slice(startIndex, endIndex)` to determine which rows to render. The absolute index is preserved by computing `pageStartIndex + localIndex` so that `categoryMap` lookups and `onCategoryChange` callbacks remain correct.

### 3. Pagination bar rendered below the table
**Rationale:** Placed after `</table>` and before the empty-state message. Contains: left arrow, page input, "of N" label, right arrow. Consistent with common table pagination patterns.

### 4. Page input uses controlled `<input type="number">`
**Rationale:** Allows direct page entry. Clamped on blur/Enter to `[1, totalPages]`. Displayed as 1-indexed for user-friendliness.

### 5. Reset to page 1 when `transactions` array changes
**Rationale:** If the user uploads a new file, the page index must reset. Use a `useEffect` watching `transactions.length`.

## Risks / Trade-offs

- **Index mapping complexity** → Mitigated by computing `absoluteIndex = pageStartIndex + localIndex` in the map callback. Existing test coverage for `computeSummary` and `formatAmount` is unaffected.
- **Edge case: exactly 25 rows** → Single page, both arrows disabled. Handled naturally by `totalPages = Math.ceil(length / PAGE_SIZE)`.
- **Page input UX** → User could type "0" or a negative number. Clamping on commit prevents this.
