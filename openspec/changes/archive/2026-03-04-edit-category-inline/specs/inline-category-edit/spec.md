## ADDED Requirements

### Requirement: Inline category editing in the category manager
The system SHALL allow users to edit existing preset categories directly from the category list by clicking on the category text.

#### Scenario: User opens the inline category editor
- **WHEN** user clicks on the text of a category in the sidebar list
- **THEN** system replaces the text with an active text input field containing the current name

#### Scenario: User saves a new category name
- **WHEN** user presses Enter or clicks outside the input field
- **THEN** system updates the category name in the list and persists the change to local storage

#### Scenario: User cancels editing
- **WHEN** user presses the Escape key while editing
- **THEN** system closes the editor and reverts to the original category name

#### Scenario: Validation of new category name
- **WHEN** user tries to save an empty category name or a name that already exists
- **THEN** system reverts to the original category name without saving
