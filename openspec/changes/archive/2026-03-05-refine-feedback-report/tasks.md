## 1. Rewrite `buildReviewMarkdown()`

- [x] 1.1 Filter transactions to only those with non-empty annotations — iterate using `annotations` map keys instead of the full `transactions` array
- [x] 1.2 Rename all "Annotation" references to "Developer Note" in the output markdown
- [x] 1.3 Reorder per-transaction fields: Developer Note first, then metadata table (Date, Raw Description, Amount, Transaction Code, Assigned Category, Notes), then API Payload + API Output as fenced JSON blocks, then AI Reasoning as blockquote
- [x] 1.4 Format metadata fields as a Markdown table (`| Field | Value |` format)
- [x] 1.5 Wrap API Payload and API Output in ` ```json ` fenced code blocks
- [x] 1.6 Wrap AI Reasoning in a `>` blockquote
- [x] 1.7 Remove the Raw API Payload section at the bottom of the report (the `if (debugData?.rawPayload)` block)
- [x] 1.8 Add an empty-state message when no transactions are flagged (header + "No items were flagged for review.")

## 2. Extract per-transaction API payload

- [x] 2.1 Move the per-transaction payload extraction logic (currently in `index.tsx` ReviewTable) into a shared helper or inline it in `buildReviewMarkdown()` so the export has access to the same `{ payee, notes, transactionType }` JSON per row

## 3. Testing

- [x] 3.1 Update or create unit tests for `buildReviewMarkdown()` — verify only annotated transactions appear
- [x] 3.2 Test edge case: no annotations → report contains only header + empty-state message
- [x] 3.3 Test that Raw API Payload section is absent from output
- [x] 3.4 Test field ordering: Developer Note appears before metadata table, API blocks, and reasoning
