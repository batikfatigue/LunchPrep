## Why

LunchPrep currently only supports a light theme. The CSS variables for a dark palette already exist in `globals.css` (under `.dark`), but there is no mechanism for users to activate it. Many users prefer dark mode for reduced eye strain during extended sessions, and it's become a baseline expectation for modern web apps. Adding a toggle improves usability and aligns with the app's privacy-first, user-centric principles.

## What Changes

- Add a **theme toggle** (light / dark / system) accessible from the main UI header area.
- Implement **theme persistence** via `localStorage` so the user's preference is remembered across sessions.
- Apply the `.dark` class to the `<html>` element when dark mode is active, leveraging the existing CSS variable system.
- Ensure the `<html>` tag respects `prefers-color-scheme` when set to "system" (default).
- Prevent **flash of unstyled content (FOUC)** by injecting a blocking script in `<head>` that reads the stored preference before paint.

## Capabilities

### New Capabilities
- `theme-toggle`: User-facing theme switching (light/dark/system) with persistence, FOUC prevention, and a toggle UI component.

### Modified Capabilities
_None — this change is purely additive. No existing spec-level behaviour changes._

## Impact

- **`src/app/layout.tsx`**: Will need a blocking `<script>` in `<head>` for FOUC prevention and the theme class on `<html>`.
- **`src/components/`**: New theme toggle component (e.g., `theme-toggle.tsx`).
- **`src/lib/`**: New `theme.ts` utility for reading/writing theme preference.
- **`src/app/page.tsx`**: Minor update to include the toggle in the header area.
- **No backend changes** — theme is entirely client-side.
- **No new dependencies** — uses native `matchMedia` and `localStorage` APIs.
