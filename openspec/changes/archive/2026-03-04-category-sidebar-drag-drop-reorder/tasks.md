## 1. Install Dependencies

- [x] 1.1 Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` via npm
- [x] 1.2 Verify the packages appear in `package.json` and `package-lock.json`

## 2. Update CategoryEditor Component

- [x] 2.1 Remove `ChevronUp` and `ChevronDown` imports from `category-editor.tsx`
- [x] 2.2 Add `GripVertical` import from `lucide-react`
- [x] 2.3 Import `DndContext`, `closestCenter`, `PointerSensor`, `KeyboardSensor`, `useSensor`, `useSensors` from `@dnd-kit/core`
- [x] 2.4 Import `SortableContext`, `useSortable`, `verticalListSortingStrategy`, `arrayMove` from `@dnd-kit/sortable`
- [x] 2.5 Import `CSS` from `@dnd-kit/utilities`
- [x] 2.6 Create a `SortableCategoryRow` sub-component that wraps each category row with `useSortable` and renders the drag handle (GripVertical) instead of chevron buttons
- [x] 2.7 Wrap the category list `<ul>` in `<DndContext>` and `<SortableContext>` with `verticalListSortingStrategy`
- [x] 2.8 Implement the `onDragEnd` handler using `arrayMove` to reorder and call `onCategoriesChange`
- [x] 2.9 Configure `PointerSensor` and `KeyboardSensor` (with `sortableKeyboardCoordinates`) in `useSensors`
- [x] 2.10 Ensure the drag handle has `aria-label="Drag to reorder <category>"` for accessibility

## 3. Update Tests

- [x] 3.1 Locate existing tests for `CategoryEditor` (in `src/__tests__/` or co-located)
- [x] 3.2 Remove or replace tests that fire click events on the removed chevron buttons
- [x] 3.3 Add test: each row renders a drag handle icon and does NOT render chevron buttons
- [x] 3.4 Add test: `onDragEnd` with a valid drag calls `onCategoriesChange` with the correctly reordered array (mock `arrayMove` or simulate via the handler directly)
- [x] 3.5 Add test: `onDragEnd` with the same source and destination does not call `onCategoriesChange`
- [x] 3.6 Verify all other existing tests (add, remove, edit, reset) still pass

## 4. Manual Verification

- [x] 4.1 Run `npm run dev` and open the landing page; confirm the category sidebar shows drag handles
- [x] 4.2 Drag a category to a new position; confirm the list reorders correctly and persists after page reload
- [x] 4.3 Use keyboard (Tab to handle, Space to pick up, Arrow keys to move, Space to drop) to reorder; confirm it works
- [x] 4.4 Press Escape while dragging via keyboard; confirm the item returns to its original position
- [x] 4.5 Run `npm test` and confirm all tests pass
- [x] 4.6 Run `npm run build` and confirm no TypeScript or build errors

## 5. Keyboard Navigation UX — Grid-Style Arrow Navigation

- [x] 5.1 Add a 2D ref map (`gridRefs`) to `CategoryEditor` to track focusable elements (drag handle = col 0, X button = col 1) per row
- [x] 5.2 All interactive elements keep `tabIndex={0}` so Tab cycles through everything naturally
- [x] 5.3 ArrowUp/Down on any element moves focus to the same column in the adjacent row (wraps at edges)
- [x] 5.4 ArrowLeft/Right moves focus between handle and X within the same row (clamps at edges)
- [x] 5.5 Space still triggers `@dnd-kit` drag pickup on focused handle (no interference)
- [x] 5.6 Add `role="grid"` and `aria-label="Category list"` to the `<ul>` for screen reader context
- [x] 5.7 Fix focus ring jumping during keyboard drag: track `isDraggingActive` via `onDragStart`/`onDragEnd` and explicitly style the dragged item while suppressing others
- [x] 5.8 Manual test: Tab through handles + X's → arrows navigate in 4 directions → Space picks up → focus ring follows dragged item → Space drops
