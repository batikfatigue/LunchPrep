## Context

The LunchPrep landing page includes a CategoryEditor component that allows users to manage their preset categories for AI categorisation. Currently, users can add and remove categories, but they cannot edit existing ones. To streamline the customization process, users should be able to click on a category name in the list and edit it inline.

## Goals / Non-Goals

**Goals:**
- Allow users to click on a category name in the sidebar list to edit it inline as a text input.
- Save the category immediately when the user presses Enter or clicks outside the input.
- Prevent saving empty category names or duplicates.

**Non-Goals:**
- Complex validation beyond duplicate checking.

## Decisions

- **Interactive Element**: Instead of rendering a static `<span>`, we'll render an `EditableCategory` sub-component that switches to an `<input>` when clicked.
- **State Management**: The editing state (whether it's currently an input or text) runs locally in the sub-component. On save, we'll invoke the parent's `onCategoriesChange` callback with the updated array.
- **Validation**: If the user tries to save an empty string, we revert to the original value. If they enter a duplicate of an existing category, we can either revert or show an error. To keep it simple, we will revert to the original value or prevent the edit if it's a duplicate.

## Risks / Trade-offs

- **Risk**: User confusion if they accidentally click and enter edit mode.
  **Mitigation**: The input should immediately be focused and highlighted so it's clear they are editing. Escaping should cancel the edit.
