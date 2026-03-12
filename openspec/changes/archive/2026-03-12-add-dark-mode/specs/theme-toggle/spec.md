## ADDED Requirements

### Requirement: Theme preference storage
The system SHALL store the user's theme preference (`light`, `dark`, or `system`) in `localStorage` under the key `lunchprep-theme`.

#### Scenario: User selects a theme
- **WHEN** the user selects a theme via the toggle (light, dark, or system)
- **THEN** the selected value SHALL be written to `localStorage` under `lunchprep-theme`

#### Scenario: No stored preference
- **WHEN** no value exists in `localStorage` for `lunchprep-theme`
- **THEN** the system SHALL default to `system` (follow OS preference)

#### Scenario: localStorage unavailable
- **WHEN** `localStorage` is unavailable (e.g., private browsing restrictions)
- **THEN** the system SHALL fall back to `system` without errors

---

### Requirement: Theme resolution
The system SHALL resolve the effective theme (light or dark) from the stored preference and the OS `prefers-color-scheme` media query.

#### Scenario: Explicit light preference
- **WHEN** the stored preference is `light`
- **THEN** the effective theme SHALL be `light`, regardless of OS setting

#### Scenario: Explicit dark preference
- **WHEN** the stored preference is `dark`
- **THEN** the effective theme SHALL be `dark`, regardless of OS setting

#### Scenario: System preference with dark OS
- **WHEN** the stored preference is `system` and the OS reports `prefers-color-scheme: dark`
- **THEN** the effective theme SHALL be `dark`

#### Scenario: System preference with light OS
- **WHEN** the stored preference is `system` and the OS reports `prefers-color-scheme: light`
- **THEN** the effective theme SHALL be `light`

---

### Requirement: Theme application via CSS class
The system SHALL apply the effective theme by adding or removing the `dark` class on the `<html>` element.

#### Scenario: Dark theme is active
- **WHEN** the effective theme is `dark`
- **THEN** the `<html>` element SHALL have the class `dark`

#### Scenario: Light theme is active
- **WHEN** the effective theme is `light`
- **THEN** the `<html>` element SHALL NOT have the class `dark`

---

### Requirement: FOUC prevention
The system SHALL apply the correct theme class before the browser's first paint, preventing a flash of incorrect theme.

#### Scenario: Page load with dark preference
- **WHEN** a user with a stored `dark` preference loads any page
- **THEN** the `dark` class SHALL be present on `<html>` before any visible content renders

#### Scenario: Page load with system preference matching dark
- **WHEN** a user with a stored `system` preference and OS dark mode enabled loads any page
- **THEN** the `dark` class SHALL be present on `<html>` before any visible content renders

---

### Requirement: Theme toggle UI
The system SHALL provide a toggle button in the page header that allows the user to cycle through themes.

#### Scenario: Toggle cycle order
- **WHEN** the user clicks the theme toggle
- **THEN** the theme SHALL cycle in the order: light → dark → system → light

#### Scenario: Visual indicator
- **WHEN** the current theme is light
- **THEN** the toggle SHALL display a sun icon
- **WHEN** the current theme is dark
- **THEN** the toggle SHALL display a moon icon
- **WHEN** the current theme is system
- **THEN** the toggle SHALL display a monitor icon

#### Scenario: Immediate application
- **WHEN** the user clicks the toggle
- **THEN** the new theme SHALL be applied immediately without a page reload

---

### Requirement: System preference change reactivity
The system SHALL react to OS-level theme changes in real time when the preference is set to `system`.

#### Scenario: OS switches to dark while preference is system
- **WHEN** the stored preference is `system` and the user changes their OS to dark mode
- **THEN** the app SHALL switch to dark theme in real time without user interaction

#### Scenario: OS changes while preference is explicit
- **WHEN** the stored preference is `light` or `dark` and the OS theme changes
- **THEN** the app theme SHALL NOT change
