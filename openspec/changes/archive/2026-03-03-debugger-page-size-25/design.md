## Components

### [CategorisationDebuggerDevTool](file:///Users/justinng/Projects/LunchPrep/LunchPrep/src/dev-tools/categorisation-debugger/index.tsx)

- **State**: Add `currentPage` state to `ReviewOverlay` to track the current page of transactions being reviewed.
- **Logic**:
  - Implement `PAGE_SIZE = 25` as an internal constant.
  - Calculate `totalPages` based on `transactions.length`.
  - Slice the `transactions` array before passing to `ReviewTable`, or perform the slice within `ReviewTable` using `currentPage`.
- **UI**:
  - Add a pagination control block to the `ReviewOverlay` header.
  - Controls include "Previous", "Next", and a "Page X of Y" label.
  - Add new inline styles to `S` for pagination buttons and container (consistent with existing dev tool aesthetics).

## Data Models

- **Pagination State**: `number` (0-indexed page number).

## Logic

- **Page Calculation**: `Math.ceil(totalTransactions / 25)`.
- **Slicing**: `transactions.slice(currentPage * 25, (currentPage + 1) * 25)`.
- **Boundary Checks**: Ensure `currentPage` is clamped between `0` and `totalPages - 1`.
- **State Persistence**: Reset `currentPage` to `0` whenever the `transactions` prop changes (using `useEffect`).
