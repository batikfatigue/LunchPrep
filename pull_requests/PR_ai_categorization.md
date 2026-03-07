# [PR] feat: AI Categorization & PII Anonymization

## Description
This PR integrates Phase 2 of the project: **AI Categorization** and **PII Anonymization**, building on the core data pipeline. It introduces a secure way to mask sensitive transaction data before sending it to an LLM for categorization, a new batch processing API, and a React-based transaction table for the UI.

## Changes

### 🛡️ PII Anonymization
- Created `src/lib/anonymiser/pii.ts` to identify and mask sensitive data (names, accounts, locations) using refined regex patterns.
- Added comprehensive unit tests in `tests/anonymiser/pii.test.ts`.

### 🤖 AI Categorization
- **Client & Prompting:** Implemented `src/lib/categoriser/client.ts` and `prompt.ts` with strict schema enforcement.
- **API Route:** Added `src/app/api/categorise/route.ts` for efficient batch processing of transactions.
- **Categorization Schema:** Defined standard categories in `src/lib/categoriser/categories.ts`.

### 🖥️ UI Components
- **Transaction Table:** Implemented `src/components/transaction-table.tsx` to handle display and interaction with parsed/categorized data.

### ⚙️ Core Pipeline Updates
- Updated the **Lunch Money Exporter** (`src/lib/exporter/lunchmoney.ts`) to support mapping the new AI-generated categories.

### 📄 Documentation & Planning
- Added Phase 2 integration specs in `PRPs/phase2-ai-integration.md`.
- Updated `docs/todo.md` to reflect progress.

## Type of Change
- [x] New feature
- [ ] Bug fix
- [x] Refactor (Exporter updates)
- [x] Documentation

## Testing
- **Automated:** `npm test` runs 100% success for:
  - `pii.test.ts`: Validates masking of realistic sample data.
  - `prompt.test.ts`: Ensures AI prompts meet structure requirements.
  - `dbs.test.ts` & `lunchmoney.test.ts`: Verified existing pipeline integrity.
- **Manual:** Verified batch API response formats and UI table rendering.

## Related Issue
N/A

## Screenshots (if UI changes)
*Placeholder for Transaction Table UI*
