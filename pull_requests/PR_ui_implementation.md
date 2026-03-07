# PR Description: Phase 3 UI Implementation

## Description
This PR implements the core UI components and transaction management logic for Phase 3. It adds support for file uploads, API key management (BYOK), and enhances the transaction review experience with inline editing and summary totals.

## Changes
- **New UI Components**: Added `FileUpload` (drag-and-drop), `ApiKeyInput` (persistence), `CategoryEditor`, and `PipelineSteps`.
- **Enhanced Transaction Table**:
    - Integrated **inline editing** for Payee/Description and Notes.
    - Added a **Summary Footer** that calculates and displays total debits, credits, and net amount.
    - Improved visual feedback for debit/credit amounts.
- **State & Persistence**: Added `useLocalStorage` hook to persist transactions, categories, and API keys across sessions.
- **Animations**: Integrated `framer-motion` for smooth UI transitions between pipeline steps.
- **Verification**: Added unit tests for transaction summary logic, local storage persistence, and file validation utilities.

## Testing
- Unit tests added to `tests/components/` and `tests/hooks/`.
- Manual verification of drag-and-drop and inline editing functionality.
