## FEATURE:
Implement Phase 3 features focusing on Customisation and UI for the Next.js 16 application. This includes:
1. **Category Management UI**: Build a UI to add, remove, and reorder custom categories. Persist these categories to `localStorage` and load them on startup, falling back to default categories if none exist.
2. **Bring Your Own Key (BYOK)**: Create an API key input component (`src/components/api-key-input.tsx`). Store the user's Gemini API key in `localStorage` and display an active key mode indicator. Route categorisation calls directly from the browser to Gemini when a BYOK key is set, bypassing the server proxy.
3. **UI Polish**:
   - Create a file upload component with drag-and-drop and a file picker (`src/components/file-upload.tsx`).
   - Implement a transaction review table with inline editing capabilities for payee, notes, and category (`src/components/transaction-table.tsx`). Use red/green colour coding for debit/credit amounts. Add a summary row for total debits, total credits, and net amount.
   - Build a pipeline step indicator component (`src/components/pipeline-steps.tsx`) displaying the flow: Upload → Review → Export.

## EXAMPLES:
- Reference existing shadcn/ui components in `src/components/ui/` for building the `file-upload.tsx`, `api-key-input.tsx`, `transaction-table.tsx`, and `pipeline-steps.tsx`.
- The category management should mimic standard list management interfaces with reordering capabilities.
- The transaction review table should mimic standard editable data tables.
- Reference `src/lib/categoriser/categories.ts` for the default categories to fall back to.

## DOCUMENTATION:
- Next.js 16 Documentation: https://nextjs.org/docs
- Tailwind CSS v4 Documentation: https://v4.tailwindcss.com/docs
- shadcn/ui Documentation: https://ui.shadcn.com/docs
- Web Storage API (localStorage): https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- Gemini API Documentation (for direct browser calls): https://ai.google.dev/docs

## OTHER CONSIDERATIONS:
- **State Management**: Ensure React state stays synchronised with `localStorage` for both custom categories and the BYOK API key. Consider using a custom hook for `localStorage`.
- **Security**: When using BYOK, the Gemini API key will be stored in the browser's `localStorage` and sent directly to the Gemini API from the client. Ensure no keys are logged or leaked.
- **Responsiveness**: All new UI components (file upload, transaction table, pipeline steps) must be fully responsive and work well on mobile devices.
- **Performance**: The transaction review table should handle potentially hundreds of rows efficiently.
- **Error Handling**: Provide clear error messages if the user provides an invalid BYOK API key or if inline edits fail validation.