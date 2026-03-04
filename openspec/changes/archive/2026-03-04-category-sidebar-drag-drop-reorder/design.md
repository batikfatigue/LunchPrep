## Context

The `CategoryEditor` component (`src/components/category-editor.tsx`) currently uses chevron buttons (ChevronUp/ChevronDown) to reorder categories one step at a time. This is functional but tedious for lists longer than a few items. The component is rendered in the landing page sidebar before CSV conversion begins, and its state is managed by the parent via `onCategoriesChange` + `useLocalStorage`.

The codebase uses React 18, Next.js 16, TypeScript strict, shadcn/ui, and Tailwind CSS 4. There are no existing drag-and-drop utilities in the project.

## Goals / Non-Goals

**Goals:**
- Replace chevron buttons with a drag handle (GripVertical icon) per category row
- Enable smooth, accessible drag-and-drop reordering within the category list
- Keep all other interactions (add, remove, inline edit, reset) unchanged
- Remain keyboard-accessible (drag handles must be operable without a mouse)
- No change to the localStorage schema or `onCategoriesChange` contract

**Non-Goals:**
- Drag-and-drop across different component instances or pages
- Touch/mobile optimised DnD (nice-to-have, but not required for this change)
- Animated transitions beyond what the DnD library provides by default

## Decisions

### Decision: Use `@dnd-kit/core` + `@dnd-kit/sortable`

**Chosen**: `@dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)

**Rationale**:
- Actively maintained, purpose-built for React
- First-class keyboard accessibility (ARIA live regions, keyboard navigation)
- Modular — only import what's needed, no full framework overhead
- Works with SSR/Next.js out of the box
- No conflicts with shadcn/ui or Tailwind
- Alternatives considered:
  - `react-beautiful-dnd` — archived/unmaintained
  - `react-dnd` — heavier, requires a backend, less accessible
  - Native HTML5 DnD — poor accessibility, no touch support, complex state management

### Decision: Remove chevron buttons entirely

**Rationale**: The drag handle replaces the chevron buttons as the reorder mechanism. Keeping both would clutter the UI and confuse users. Keyboard users can use the drag handle's keyboard support (space to pick up, arrow keys to move, space/enter to drop) which is more ergonomic than clicking buttons.

### Decision: Keep `key` prop stable using category value + index

**Rationale**: The existing `key={`${cat}-${index}`}` pattern is fine for the DnD context because `@dnd-kit/sortable` uses its own `id` prop for tracking items during drag. We'll use the category string itself as the sortable `id` (guaranteed unique by existing duplicate-check logic).

### Decision: Grid-style Keyboard Navigation

**Rationale**: Instead of a "roving tabindex" that breaks natural Tab flow, a grid-style navigation approach was chosen. All interactive elements (drag handles and remove buttons) retain `tabIndex={0}` so Tab works normally. Arrow keys provide 4-directional navigation (Up/Down between rows, Left/Right within rows) using a 2D ref map. This provides standard list accessibility while adding power-user keyboard shortcuts.

### Decision: Explicit Focus Ring Management During Drag

**Rationale**: When @dnd-kit swaps DOM nodes mid-drag during keyboard reordering, browser focus stays at the static DOM position, causing the focus ring to "jump" to the displaced item. To fix this, an `isDraggingActive` state suppresses default browser focus rings on all handles during a drag, and an explicit `ring-2` is applied only to the actively dragged item (`isDragging`).

## Risks / Trade-offs

- **Duplicate category names as DnD IDs** → The existing add handler already prevents duplicates (case-insensitive), so category strings are safe to use as stable IDs. No change needed.
- **SSR hydration** → `@dnd-kit` is client-side only; `CategoryEditor` is already `"use client"`, so no hydration mismatch risk.
- **Bundle size** → `@dnd-kit` adds ~8–12 KB gzipped. Acceptable for the UX improvement.
- **Test coverage** → JSDOM does not support pointer/drag events natively; existing tests that use `fireEvent.click` on chevron buttons will need to be replaced with tests for drag handle presence and keyboard reorder via `@dnd-kit`'s `KeyboardSensor`.
