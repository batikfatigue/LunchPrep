## ADDED Requirements

### Requirement: Paginated debugger table
The categorisation debugger table SHALL support pagination to handle large numbers of transactions efficiently, displaying a maximum of 25 transactions per page.

#### Scenario: Navigating between pages
- **WHEN** more than 25 transactions are provided to the debugger
- **THEN** the table displays only the first 25 items, and provides "Previous" and "Next" controls to navigate the full list.

#### Scenario: Pagination state reset
- **WHEN** the input transactions change (e.g., a new file is uploaded)
- **THEN** the debugger pagination SHALL reset to the first page.
