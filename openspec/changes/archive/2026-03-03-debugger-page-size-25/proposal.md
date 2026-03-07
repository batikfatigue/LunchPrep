## Why

The categorisation debugger currently displays all transactions in a single list (inside an overlay). As the number of transactions increases, this can lead to performance issues and a cluttered UI. Parity with the main `TransactionTable` (which shows 25 items per page) is desirable for a consistent user experience. This change allows the user to review a substantial "single page" of 25 transactions before needing to paginate.

## What Changes

- Add pagination logic to the `CategorisationDebuggerDevTool` component.
- Implement a `PAGE_SIZE` of 25 for the debugger table.
- Add pagination controls (Previous/Next buttons and page indicator) to the debugger overlay.
- Ensure only 25 items are rendered at a time in the debugger's `ReviewTable`.

## Capabilities

### Modified Capabilities
- `dev-tools-categorisation-debugger`: Add pagination support to the debugger table with a default page size of 25.
