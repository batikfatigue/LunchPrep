## ADDED Requirements

### Requirement: Paginated transaction display
The transaction review table SHALL display at most 25 transaction rows per page. All transactions beyond the page boundary SHALL be accessible via page navigation controls.

#### Scenario: Table shows first 25 transactions on load
- **WHEN** the review table renders with more than 25 transactions
- **THEN** only the first 25 transactions are displayed and the remaining transactions are hidden

#### Scenario: Table shows all transactions when fewer than 25
- **WHEN** the review table renders with 25 or fewer transactions
- **THEN** all transactions are displayed on a single page

### Requirement: Arrow navigation with boundary guards
The pagination controls SHALL include left (previous) and right (next) arrow buttons. The left arrow SHALL be disabled on the first page and the right arrow SHALL be disabled on the last page.

#### Scenario: Navigating to next page
- **WHEN** the user clicks the right arrow and the current page is not the last page
- **THEN** the table displays the next 25 transactions (or remaining transactions if fewer than 25 remain)

#### Scenario: Navigating to previous page
- **WHEN** the user clicks the left arrow and the current page is not the first page
- **THEN** the table displays the previous 25 transactions

#### Scenario: Left arrow disabled on first page
- **WHEN** the current page is the first page
- **THEN** the left arrow button SHALL be visually disabled and non-interactive

#### Scenario: Right arrow disabled on last page
- **WHEN** the current page is the last page
- **THEN** the right arrow button SHALL be visually disabled and non-interactive

### Requirement: Direct page jump via numeric input
The pagination controls SHALL include a numeric input field that allows the user to type a page number and jump directly to that page.

#### Scenario: Jumping to a valid page
- **WHEN** the user enters a valid page number (between 1 and total pages) and confirms
- **THEN** the table navigates to the specified page

#### Scenario: Clamping out-of-range page input
- **WHEN** the user enters a page number less than 1 or greater than total pages
- **THEN** the input value SHALL be clamped to the nearest valid page (1 or total pages)

### Requirement: Summary footer reflects all transactions
The summary footer row SHALL continue to show totals computed from all transactions, not just the transactions visible on the current page.

#### Scenario: Summary is consistent across pages
- **WHEN** the user navigates between pages
- **THEN** the summary footer (total debits, credits, net) remains unchanged and reflects all transactions

### Requirement: Page resets on new data
The current page SHALL reset to page 1 when the transaction data changes (e.g. a new file is uploaded).

#### Scenario: Uploading a new CSV file
- **WHEN** the transactions array changes (new file parsed)
- **THEN** the table resets to display page 1

### Requirement: Absolute index preservation
Category assignments, payee edits, and notes edits SHALL reference the absolute transaction index (not the page-local index) so that edits on any page correctly map to the right transaction.

#### Scenario: Editing a category on page 2
- **WHEN** the user changes the category of the 3rd row on page 2 (absolute index 27)
- **THEN** the `onCategoryChange` callback fires with index 27
