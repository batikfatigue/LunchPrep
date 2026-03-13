## Context

The DBS parser's `parseAmount()` function was changed to return positive values for debits and negative for credits. This is inverted from the intended convention: Lunch Money expects negative amounts for expenses and positive for income. The fix is a minimal, targeted revert of that sign logic.

The downstream pipeline (anonymiser, exporter, review table) all assume the correct convention and require no changes.

## Goals / Non-Goals

**Goals:**
- Restore `parseAmount()` to return negative for debits, positive for credits
- Update `specs/bank-parsing.md` to document the correct convention
- Update any tests asserting on the wrong sign values

**Non-Goals:**
- Changes to the exporter, UI display layer, or categoriser
- Changing how amounts are stored or formatted in the output CSV

## Decisions

**Fix only `parseAmount()` in `dbs.ts`** — The bug is entirely contained in a single 10-line function. No architectural changes are needed; this is a straightforward two-line swap.

## Risks / Trade-offs

- [Risk]: Tests written against the buggy behavior will fail after the fix → Mitigation: Update all affected test assertions as part of the same change.
