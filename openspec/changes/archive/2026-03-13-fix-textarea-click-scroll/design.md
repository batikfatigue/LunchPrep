## Context

The transaction table renders `EditableCell` components for payee and notes columns. When a user clicks one of these cells, two things happen simultaneously: (1) the cell enters edit mode, and (2) the click bubbles up to the `<tr onClick>` handler which calls `onRowSelect(index)`. This triggers the inspector's `useEffect` that scrolls the panel into view — an unwanted side-effect when the user just wants to edit inline.

The same problem occurs on blur: when the user clicks elsewhere on the row to finish editing, the input commits and the row click fires, scrolling the inspector again.

## Goals / Non-Goals

**Goals:**
- Clicks on `EditableCell` (entering edit mode or interacting with the input) must not trigger inspector scroll.
- Clicks on the row that blur an active `EditableCell` must not trigger inspector scroll.
- A deliberate follow-up click on the row (when no cell is editing) must scroll the inspector as normal.

**Non-Goals:**
- Changing the scroll-into-view mechanism itself (smooth scroll, `block: "nearest"`, etc.).
- Modifying keyboard navigation behaviour.
- Changing the inspector's internal keyboard-nav skip logic (`lastInternalIndexRef`).

## Decisions

### 1. Stop propagation at EditableCell level

**Decision**: Call `e.stopPropagation()` on the EditableCell's wrapping element (or on both the display span and the input) to prevent the click from reaching the `<tr onClick>`.

**Rationale**: This is the simplest, most localised fix. It requires no coordination between components and no shared refs or state. The EditableCell already manages its own editing state, so it knows when to suppress.

**Alternatives considered**:
- *Check `e.target` in the row handler* — fragile; relies on DOM structure and breaks if EditableCell markup changes.
- *Flag-based approach in the inspector scroll effect* — over-engineered; the problem is in the table, not the inspector.

### 2. Blur-then-click suppression via a brief refractory ref

**Decision**: When an `EditableCell` input blurs (edit committed), set a module-level or row-level ref flag (`editJustEndedRef.current = true`) and clear it after a `requestAnimationFrame` or `setTimeout(0)`. In the `<tr onClick>` handler, if the flag is set, skip calling `onRowSelect`.

**Rationale**: When a user clicks outside the input to finish editing, the browser fires `blur` on the input before `click` on the row. A one-frame refractory period lets us detect this "blur-caused click" and suppress it, without affecting subsequent intentional clicks.

**Alternatives considered**:
- *`pointerdown` + `relatedTarget`* — `relatedTarget` is unreliable for blur events across different element types.
- *Wrapping the entire row in a "click cooldown"* — too broad; could suppress legitimate clicks in non-editable cells.

## Risks / Trade-offs

- **Race condition on the refractory timeout**: If `requestAnimationFrame` fires before the click event in some browsers, the flag could clear too early. Mitigation: use `setTimeout(0)` as a fallback, which consistently fires after the click in the same task queue. Test across Chrome and Safari.
- **Multiple EditableCells per row**: Both payee and notes cells need the same suppression. Mitigation: the ref is shared at the row level (or per-table via a single ref), not per-cell.
