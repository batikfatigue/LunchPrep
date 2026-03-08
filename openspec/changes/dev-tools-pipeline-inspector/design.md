## Context

The anonymisation pipeline in `page.tsx` runs through five discrete stages
(`parsed → anonymised → sent → categorised → restored`) inside `triggerCategorise`.
Each stage already produces new `RawTransaction` objects (no in-place mutation),
but the intermediate arrays are discarded — only the final restored state is kept.

The goal is to capture those intermediates and surface them in a dev tool without
leaving residue in production code if the feature is later removed.

## Goals / Non-Goals

**Goals:**
- Capture transaction state at each pipeline stage during a dev build
- Render a per-transaction stage diff table in the dev environment only
- Ensure complete removal requires only: deleting `src/dev-tools/pipeline-inspector/` and localised changes in `page.tsx`
- Zero production bundle impact

**Non-Goals:**
- Globally accessible tool (keyboard shortcut, floating shell) — inspector is page-scoped
- Historical comparison across multiple pipeline runs
- Editing or replaying pipeline stages from the inspector

## Decisions

### 1. Pattern B (inline detail pane) over Pattern A (floating shell registry)

Pattern A would require a module singleton to share data across component trees
(`page.tsx` state → floating shell in `layout.tsx`). That singleton and its
subscribe/notify API would be residue if the feature were removed.

Pattern B renders the inspector as a detail pane below the transaction table.
Data flows via props — no shared store needed. Deletion surface: one `useState`,
capture lines in `triggerCategorise`, and one JSX line.

**Pagination concern dismissed:** a detail pane below a paginated list is
standard master-detail UX. The inspector shows whichever transaction was last
selected, regardless of which page the table is on. It persists until the user
clicks a different row. This is the same pattern used by file explorers, email
clients, and IDE property panels.

### 2. Transaction selection via row click, not dropdown

Clicking a row in the transaction table selects it for inspection. A
`selectedIndex` state variable in `page.tsx` is passed to both
`TransactionTable` (to highlight the selected row) and `PipelineInspector`
(to determine which transaction to show). This is more direct than a dropdown
inside the inspector and spatially links the table to the detail pane.

### 3. No shared store — React state as the data channel

A module-level singleton would persist across hot reloads, be harder to reset,
and require a subscribe/notify API. Since the inspector is a direct child of
`page.tsx` (Pattern B), passing `snapshots` as a prop is idiomatic React and
requires no additional infrastructure.

### 4. `PipelineSnapshot` type lives in `src/lib/`

`page.tsx` needs the `PipelineSnapshot` type to type its state variable, but
cannot statically import from `src/dev-tools/`. The type (data shape only, no
runtime code) is placed in `src/lib/pipeline-snapshot.ts`. Both `page.tsx` and
the dev-tool component import it from there. This follows the existing pattern
of `DebugData` in `src/lib/categoriser/client.ts`.

### 5. `sent` stage uses a distinct type, not `RawTransaction`

The Gemini payload (`{ index, payee, notes, transactionType }[]`) is captured at
the `sent` stage — not the `RawTransaction` array. `PipelineSnapshot` uses a
discriminated union or separate optional field to represent this distinction,
keeping the types honest and avoiding casting.

### 6. No defensive cloning of stage arrays

The pipeline already returns new object references at every stage (`anonymise`
and `restore` both use object spread). Storing a reference to each returned
array in the snapshot is safe and avoids unnecessary allocation.

### 7. Snapshot resets at the start of each `triggerCategorise` call

To avoid showing stale data from a previous run, the snapshot state is reset
(set to `{}`) at the top of `triggerCategorise` before any stage is captured.

## Risks / Trade-offs

**`page.tsx` has new touches** → These are the intentional coupling points:
`snapshots` state, `selectedIndex` state, capture lines in `triggerCategorise`,
`onRowSelect` callback, and the gated JSX mount. All co-located and
self-contained. Mitigation: comment each touch with `// Dev-tools: pipeline-inspector`.

**`sent` stage is derived, not intercepted** → The Gemini payload is built by
`buildPrompt()` inside `callCategorise()`. Rather than intercepting the network call,
the `sent` snapshot is captured by calling `buildPrompt()` in `page.tsx` immediately
before `callCategorise()` (it is a pure function with no side effects). This is
accurate but means `buildPrompt` is called twice per run in dev mode.
Mitigation: gate the extra call behind the `NEXT_PUBLIC_DEV_TOOLS` check.

**Row click adds an `onRowSelect` prop to `TransactionTable`** → This is a
minor addition to a production component's interface. The prop is optional —
the table works unchanged when it's not provided. If the inspector is removed,
the prop is simply no longer passed.

## Open Questions

- Should the inspector show `amount` and `date` columns in addition to `payee`,
  `notes`, and `category`? These fields never change across stages, so they add
  context but no diff signal. Decision deferred to implementation.