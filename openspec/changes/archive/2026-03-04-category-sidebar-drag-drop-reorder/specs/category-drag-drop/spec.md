## ADDED Requirements

### Requirement: Drag handle replaces chevron reorder buttons
Each category row in the `CategoryEditor` SHALL display a drag handle icon (GripVertical) instead of the chevron up/down buttons. The drag handle SHALL be the sole reorder mechanism.

#### Scenario: Drag handle visible on each row
- **WHEN** the category list is rendered with one or more categories
- **THEN** each row displays a drag handle icon and does NOT display chevron up/down buttons

### Requirement: Drag-and-drop reordering
The user SHALL be able to reorder categories by dragging a category row via its drag handle to a new position in the list.

#### Scenario: Drag to reorder
- **WHEN** the user drags a category row from position N to position M (N ≠ M)
- **THEN** the category list is updated so the dragged item appears at position M and all other items shift accordingly
- **THEN** `onCategoriesChange` is called with the updated ordered list

#### Scenario: Drop at original position (no-op)
- **WHEN** the user drags a category and releases it at its original position
- **THEN** the category list order remains unchanged and `onCategoriesChange` is NOT called

### Requirement: Keyboard-accessible drag reordering
The drag handle SHALL be operable via keyboard, allowing users to reorder categories without a mouse.

#### Scenario: Keyboard pick-up and move
- **WHEN** the user focuses a drag handle and presses Space or Enter to pick up the item
- **THEN** the item enters a "dragging" state
- **WHEN** the user presses ArrowUp or ArrowDown while dragging
- **THEN** the item moves one position in the corresponding direction
- **WHEN** the user presses Space or Enter to drop
- **THEN** the item is placed at the new position and `onCategoriesChange` is called

#### Scenario: Keyboard cancel
- **WHEN** the user presses Escape while dragging via keyboard
- **THEN** the item returns to its original position and `onCategoriesChange` is NOT called

### Requirement: Other interactions unchanged
All existing `CategoryEditor` interactions (add, remove, inline edit, reset to defaults) SHALL continue to function correctly after the drag-and-drop feature is introduced.

#### Scenario: Add category after reorder
- **WHEN** the user reorders categories and then adds a new category
- **THEN** the new category appears at the end of the reordered list

#### Scenario: Remove category after reorder
- **WHEN** the user reorders categories and then removes a category
- **THEN** the correct category is removed from the reordered list

#### Scenario: Reset to defaults
- **WHEN** the user clicks the Reset button
- **THEN** the category list is replaced with the default categories regardless of any prior reordering

### Requirement: Persistence of reordered categories
Reordered categories SHALL be persisted to localStorage via the existing `onCategoriesChange` → `useLocalStorage` mechanism. No changes to the persistence contract are required.

#### Scenario: Reorder persists across page reloads
- **WHEN** the user reorders categories and reloads the page
- **THEN** the categories appear in the reordered order (because `onCategoriesChange` triggers `useLocalStorage` persistence)
