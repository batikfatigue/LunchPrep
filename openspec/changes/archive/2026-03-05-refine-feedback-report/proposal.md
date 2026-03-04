## Why

The categorisation debugger's feedback report currently includes every transaction regardless of whether it was flagged, uses a suboptimal field ordering (Payee → AI Reasoning → Annotation), and appends a raw API payload dump at the bottom. This makes the exported report noisy and hard to scan — developers only care about transactions they've annotated, and need their notes front-and-centre alongside the full debugger context.

## What Changes

- **Filter to flagged items only**: The report will only include transactions that have a developer note (annotation). Unflagged transactions are omitted entirely.
- **Rename "Annotation" to "Developer Note"**: Align terminology with its purpose.
- **Reorder fields per transaction**: Developer Note appears first, followed by all debugger fields (date, raw description, amount, transaction code, notes, API payload, API output, AI reasoning, assigned category).
- **Remove Raw API Payload section**: The bulk JSON dump at the bottom of the report is removed. Per-transaction payload snippets remain inline.
- **Improve markdown formatting**: Use tables, code blocks, and visual separators for a cleaner, more scannable report.

## Capabilities

### New Capabilities

_(none — this modifies an existing capability)_

### Modified Capabilities

- `dev-tools-categorisation-debugger`: The feedback report export format is changing — field ordering, filtering logic, section removal, and markdown styling.

## Impact

- `src/dev-tools/categorisation-debugger/export.ts` — `buildReviewMarkdown()` rewritten
- No API, dependency, or breaking changes — dev-tool only, no production impact
