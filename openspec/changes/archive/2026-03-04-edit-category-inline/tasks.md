## 1. UI Components

- [x] 1.1 Create an `EditableCategory` (or similar) sub-component in `CategoryEditor.tsx` that renders static text by default and a text input when clicked.
- [x] 1.2 Implement state management to handle entering/exiting edit mode (on click, on blur, on Enter/Escape keys).

## 2. Logic & Validation

- [x] 2.1 Implement the rename logic: when saving, take the new string, check that it's not empty, and ensure it's not a duplicate.
- [x] 2.2 If the new string is valid, call `onCategoriesChange` with the updated array matching the specific index being edited.

## 3. Integration

- [x] 3.1 Replace the existing static `<span>` rendering the category name inside the list item in `CategoryEditor` with the new editable component.
- [x] 3.2 Ensure focus is managed correctly (e.g. auto-focusing the input when edit mode starts).
