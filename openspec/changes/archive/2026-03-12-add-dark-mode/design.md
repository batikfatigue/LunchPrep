## Context

LunchPrep is a Next.js 16 + shadcn/ui + Tailwind CSS 4 application. The existing `globals.css` already defines a complete set of CSS custom properties for both light (`:root`) and dark (`.dark`) palettes using oklch values — this is standard shadcn/ui theming. However, the `<html>` element in `layout.tsx` never receives the `dark` class, so the dark palette is unused. The app currently renders in light mode only.

shadcn/ui's theming convention uses a `.dark` class on `<html>`. Tailwind 4's `@custom-variant dark (&:is(.dark *))` rule (already present in `globals.css`) ensures all `dark:` utility classes activate when this class is set.

## Goals / Non-Goals

**Goals:**
- Let users choose between light, dark, and system-preference themes.
- Persist the user's theme choice across sessions via `localStorage`.
- Eliminate flash-of-unstyled-content (FOUC) on page load by applying the correct theme before first paint.
- Follow existing project patterns (shadcn/ui, Tailwind CSS 4, Next.js server/client component separation).

**Non-Goals:**
- Custom colour palette design — the existing `:root` / `.dark` CSS variables are sufficient.
- Per-page or per-component theme overrides.
- Server-side theme detection via cookies (unnecessary complexity for a client-side-only app).
- `next-themes` or any third-party dependency — this is simple enough to implement natively.

## Decisions

### 1. Theme storage mechanism: `localStorage`
**Choice**: Store the user's preference (`light`, `dark`, or `system`) in `localStorage` under the key `lunchprep-theme`.

**Rationale**: The app is entirely client-side; there's no SSR personalisation needed. `localStorage` is synchronous, available in all target browsers, and trivial to read before paint. Cookies or server-side detection would add unnecessary complexity.

**Alternatives considered**:
- **Cookies** — Useful for SSR-based theme rendering, but LunchPrep has no server-personalised content. Adds overhead.
- **`next-themes` library** — A popular solution, but introduces a dependency for ~30 lines of logic. Keeping it in-house aligns with the "never hallucinate libraries" principle.

### 2. FOUC prevention: Inline blocking `<script>` in `<head>`
**Choice**: Add a small inline `<script>` in `layout.tsx` that reads the stored preference and applies the `.dark` class to `<html>` before the browser paints.

**Rationale**: React hydration happens _after_ first paint. Without a blocking script, users on dark mode would see a white flash on every page load. The inline script runs synchronously before paint, avoiding this.

**Alternatives considered**:
- **CSS `@media (prefers-color-scheme: dark)`** — Only handles the "system" case; can't respect an explicit user override stored in `localStorage`.
- **Server-side rendering with cookie** — Over-engineering for this use case.

### 3. Toggle UI: Icon button in the page header
**Choice**: A small icon-button component (`theme-toggle.tsx`) placed in the top-right of `page.tsx`. It cycles through light → dark → system using sun/moon/monitor icons.

**Rationale**: A header-level toggle is the most discoverable and conventional placement. Using Lucide icons (already available via shadcn/ui) keeps it visually consistent.

**Alternatives considered**:
- **Dropdown menu** — More complex, unnecessary for three options.
- **Settings page** — Too hidden for a frequently toggled feature.

### 4. Theme utility module: `src/lib/theme.ts`
**Choice**: Centralise theme logic (get/set preference, resolve effective theme, apply class) in a small utility module.

**Rationale**: Keeps the component thin and logic testable. Multiple consumers (blocking script + toggle component) need the same resolution logic.

## Risks / Trade-offs

- **Inline script increases HTML size** → Minimal: ~15 lines of JS. Acceptable trade-off for FOUC prevention.
- **`localStorage` unavailable in private/incognito** → Falls back to system preference. No error thrown — the read simply returns `null`.
- **Server component constraints** → The blocking script uses `dangerouslySetInnerHTML` in the server component (`layout.tsx`). The toggle component must be a client component (`"use client"`). This is standard Next.js practice.
