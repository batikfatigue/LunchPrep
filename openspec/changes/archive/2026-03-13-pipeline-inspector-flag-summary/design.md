## Context

The Pipeline Inspector allows for deep inspection of individual transactions but lacks a bird's-eye view of issues across multiple transactions. Users need a way to quickly see all flagged items to identify trends for improving bank-specific cleaning logic.

## Goals / Non-Goals

**Goals:**
- Provide a consolidated table of all flagged transactions and their notes.
- Enable fast navigation from the summary to any specific flagged transaction.
- Maintain isolation of dev-tool code within `src/dev-tools/`.
- Use a premium, data-rich overlay design.

**Non-Goals:**
- Showing "OK" transactions in the summary.
- Editing flags or notes within the summary (read-only list, jump to tx to edit).

## Decisions

### Modal Implementation
We will use a custom overlay instead of a standard `shadcn/ui` Dialog to have finer control over the 90vw/80vh dimensions and to keep the implementation self-contained within the dev-tools folder.

### File Structure
- `src/dev-tools/pipeline-inspector/flag-summary-overlay.tsx`: New component.
- `src/dev-tools/pipeline-inspector/index.tsx`: Updated to manage overlay visibility state.

### Keyboard Handling
The `S` shortcut will toggle the overlay. It will be added to the existing `handlePanelKeyDown` in `index.tsx`. The shortcut will be disabled when focus is in an input field (standard pattern).

### Jump Action
Clicking a row in the summary will call `onSelectIndex(index)` and set `isSummaryOpen(false)`. Since `index.tsx` already has an effect to scroll and focus on selection changes, the Inspector will automatically position itself correctly.

## Risks / Trade-offs

### Performance
Deriving the `flaggedItems` list on every render of the inspector header or overlay might be slightly expensive if there are thousands of transactions. However, since the `reviewMap` is generally small (manually flagged items) and we are in a dev environment, this is acceptable. Use `React.useMemo` if needed.
