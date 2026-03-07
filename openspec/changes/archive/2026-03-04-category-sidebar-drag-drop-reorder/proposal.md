## Why

The categories sidebar currently uses chevron up/down buttons to reorder categories, which is clunky and slow for users who want to curate their default category list before starting a CSV conversion. Drag-and-drop reordering is a more intuitive and efficient interaction pattern that reduces friction in the pre-conversion setup flow.

## What Changes

- Replace the chevron up/down buttons in `CategoryEditor` with a drag handle icon per row
- Add drag-and-drop reordering support using a lightweight DnD library (no external state management changes needed)
- Maintain existing add, remove, edit, and reset behaviours
- Persist reordered categories to localStorage (unchanged — parent already handles this)
- Keep keyboard accessibility: drag handles should be operable via keyboard for accessibility

## Capabilities

### New Capabilities

- `category-drag-drop`: Drag-and-drop reordering of categories in the `CategoryEditor` component on the landing page sidebar

### Modified Capabilities

- none

## Impact

- `src/components/category-editor.tsx` — primary change; remove chevron buttons, add drag handles and DnD logic
- New dependency: a DnD library (e.g. `@dnd-kit/core` + `@dnd-kit/sortable`) — lightweight, accessible, no conflicts with existing stack
- No API or data model changes; state shape and localStorage schema are unchanged
- Existing Vitest tests for `CategoryEditor` will need updating to cover drag events
