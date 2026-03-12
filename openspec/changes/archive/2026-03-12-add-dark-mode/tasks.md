## 1. Theme Utility Module

- [x] 1.1 Create `src/lib/theme.ts` with constants (`STORAGE_KEY = "lunchprep-theme"`, `Theme` type = `"light" | "dark" | "system"`, `EffectiveTheme` type = `"light" | "dark"`)
- [x] 1.2 Implement `getStoredTheme(): Theme` — reads from `localStorage`, returns `"system"` if absent or `localStorage` unavailable
- [x] 1.3 Implement `setStoredTheme(theme: Theme): void` — writes to `localStorage`, no-op if unavailable
- [x] 1.4 Implement `resolveTheme(preference: Theme): EffectiveTheme` — resolves to `"light"` or `"dark"` using `window.matchMedia("(prefers-color-scheme: dark)")` when preference is `"system"`
- [x] 1.5 Implement `applyTheme(effective: EffectiveTheme): void` — adds/removes `dark` class on `document.documentElement`

## 2. FOUC Prevention

- [x] 2.1 Add an inline blocking `<script>` in `src/app/layout.tsx` inside `<head>` using `dangerouslySetInnerHTML` that reads `localStorage`, resolves the effective theme, and applies the `dark` class before first paint
- [x] 2.2 Verify the inline script logic mirrors `theme.ts` resolution (duplicate the minimal logic to avoid module import in a raw script tag)

## 3. Theme Toggle Component

- [x] 3.1 Create `src/components/theme-toggle.tsx` as a `"use client"` component
- [x] 3.2 Implement cycling logic: light → dark → system → light on click
- [x] 3.3 Display the correct icon per state (Sun for light, Moon for dark, Monitor for system) using Lucide icons
- [x] 3.4 On click: update `localStorage` via `setStoredTheme`, apply theme via `applyTheme(resolveTheme(...))`, update local React state
- [x] 3.5 On mount: read stored preference with `getStoredTheme` and set initial React state

## 4. System Preference Reactivity

- [x] 4.1 In `theme-toggle.tsx`, add a `useEffect` that listens to `matchMedia("(prefers-color-scheme: dark)")` `change` events
- [x] 4.2 When the OS preference changes and stored preference is `"system"`, re-resolve and apply the theme
- [x] 4.3 Clean up the `matchMedia` listener on unmount

## 5. Page Integration

- [x] 5.1 Add the `<ThemeToggle />` component to the header area in `src/app/page.tsx`
- [x] 5.2 Ensure the toggle is visually consistent with the existing header layout and accessible (aria-label, keyboard navigable)

## 6. Testing

- [x] 6.1 Create `tests/lib/theme.test.ts` — unit tests for `getStoredTheme`, `setStoredTheme`, `resolveTheme` (mock `localStorage` and `matchMedia`)
- [x] 6.2 Test edge cases: `localStorage` unavailable, invalid stored value, `matchMedia` returning `true`/`false`
- [x] 6.3 Verify the production build still passes (`npm run build`) — no dark-mode code breaks isolation
