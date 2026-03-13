## Context

The pipeline inspector currently supports sequential keyboard navigation (A/D for prev/next) and row-click selection. Review state is tracked in an in-memory `reviewMap: Map<number, ReviewStatus>` where each entry has `status: "ok" | "flagged" | "neutral"` and a `note`. Transactions absent from the map are unreviewed.

The Flag Summary Overlay (toggled via `S`) already provides a consolidated view of flagged transactions with click-to-jump. This change adds complementary keyboard-driven navigation for faster review workflows without replacing any existing UI.

## Goals / Non-Goals

**Goals:**
- Allow direct jump to any transaction by typing its number
- Enable keyboard-only cycling through unreviewed and flagged transaction subsets
- Keep the inspector keyboard-first — no mouse-required buttons for navigation
- Maintain the existing shortcut suppression rules (disabled in sandbox, suppressed in form inputs)

**Non-Goals:**
- Flagged transaction dropdown/list — already covered by Flag Summary Overlay
- Persisting review state across sessions — separate change (`review-session-persistence`)
- Visual prev/next buttons — keyboard shortcuts remain the sole navigation mechanism
- Changing the existing A/D/←/→ sequential navigation behavior

## Decisions

### 1. Jump input as inline header element

Place a small number input directly in the inspector header bar, next to the existing transaction label (`#5 — STARBUCKS`). The input accepts 1-indexed numbers and navigates on Enter. This keeps the UI compact and avoids a separate dialog.

**Alternative considered**: Modal/popover jump dialog (like VS Code's "Go to Line"). Rejected — overhead for a simple number input; the inspector header already has space.

### 2. W/Q for unreviewed, Shift+W/Shift+Q for flagged

Use `W`/`Q` as "forward/backward through unreviewed" and `Shift+W`/`Shift+Q` for "forward/backward through flagged". This keeps the hand position near the existing A/D keys (QWERTY layout: Q-W-A-D are adjacent).

**Alternative considered**: Using number keys or bracket keys. Rejected — number keys conflict with the jump input, brackets are less discoverable.

### 3. Wrap-around navigation for subset cycling

When cycling through unreviewed or flagged subsets, wrap around from the last match to the first (and vice versa). This avoids dead-ends when the user is near the boundary and wants to cycle through all items. If no matching transactions exist, the shortcut is a no-op.

**Alternative considered**: Linear navigation (stop at boundaries). Rejected — when reviewing a subset, wrapping is more natural since you want to visit all items regardless of starting position.

### 4. Navigation helper extracted to utility functions

Extract the "find next/prev matching index" logic into pure helper functions (`findNextUnreviewed`, `findPrevUnreviewed`, `findNextFlagged`, `findPrevFlagged`) rather than inlining in the keydown handler. This keeps the handler readable and makes the logic independently testable.

### 5. Jump input component as separate file

Create `jump-input.tsx` as a new sub-component to keep `index.tsx` under 500 lines. The component receives `transactionCount`, `onJump` callback, and manages its own local input state.

## Risks / Trade-offs

- **Key conflict with future tools**: W/Q/Shift variants are now claimed. → Mitigation: Document in keyboard hint bar; reassign if a conflict arises later.
- **Wrap-around confusion**: User might not realize they've cycled past the end. → Mitigation: Could add a subtle visual flash or toast in a future iteration, but keep it simple for now.
- **Jump input stealing focus**: When the user clicks into the jump input, keyboard shortcuts must be suppressed (existing form input guard handles this). → Mitigation: The existing `e.target instanceof HTMLInputElement` suppression already covers this.
