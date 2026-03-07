## Context

The categorisation debugger exports a Markdown feedback report via `buildReviewMarkdown()` in `src/dev-tools/categorisation-debugger/export.ts`. Currently it iterates every transaction, shows a limited subset of fields (Payee, AI Reasoning, Annotation), and appends the full raw API payload JSON at the bottom. The report is used by developers for offline analysis of AI categorisation quality.

## Goals / Non-Goals

**Goals:**
- Only include transactions the developer has explicitly annotated (flagged)
- Lead each transaction section with the developer's note, followed by comprehensive debugger data
- Remove the bulk Raw API Payload section
- Produce a well-formatted, scannable Markdown document

**Non-Goals:**
- Changing the debugger UI itself (overlay, table, expanded row)
- Modifying the annotation state management or data flow
- Adding new data fields not already available in the debugger

## Decisions

### 1. Filter strategy — annotation-based

Only transactions where `annotations.get(index)` is non-empty will appear in the report. This is the simplest predicate and directly maps to "flagged items" — if a developer typed something, they want it in the report.

**Alternative considered**: Adding a separate "flag" checkbox per row. Rejected — adds UI complexity for no clear benefit when annotations already serve as the flag signal.

### 2. Per-transaction field ordering

Each transaction section will present fields in this order:

1. **Developer Note** (the annotation text — renamed from "Annotation")
2. **Date** — formatted DD/MM/YYYY
3. **Raw Description** — `originalDescription`
4. **Amount** — signed, formatted with currency
5. **Transaction Code** — `transactionCode`
6. **Assigned Category** — from `categoryMap`
7. **Notes** — `tx.notes` (parser-extracted context, e.g. PayNow OTHR)
8. **API Payload** — per-transaction extracted JSON (payee, notes, transactionType)
9. **API Output** — `{ category }` JSON
10. **AI Reasoning** — Gemini's chain-of-thought

Rationale: Developer note first because it's the human signal — the reason the item was flagged. Remaining fields follow a logical flow: identity → financials → categorisation context → AI response.

### 3. Markdown formatting approach

- Transaction header: `## Transaction N — DD/MM/YYYY — <Raw Description>`
- Key-value fields in a Markdown table for compactness
- API Payload and API Output in fenced JSON code blocks
- AI Reasoning in a blockquote for visual distinction
- Developer Note in a highlighted callout-style block

### 4. Remove raw payload section

The full batch JSON payload added no value beyond per-transaction payloads. Removing it reduces noise without losing information since each flagged transaction already includes its own extracted payload inline.

## Risks / Trade-offs

- **[Empty report]** If a user clicks "Download Review" without annotating any transactions, the report will contain only the header. → Acceptable — the report's purpose is reviewing flagged items; an empty report signals "nothing to review".
- **[Missing payload data]** If `debugData` is null (e.g. BYOK mode), API Payload/Output/Reasoning fields will show "N/A". → Already handled in current code; same approach.
