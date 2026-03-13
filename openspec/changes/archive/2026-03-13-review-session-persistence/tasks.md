## 1. Session types and serialisation

- [x] 1.1 Define `SavedSession` interface (meta + state + version) in a new `src/lib/session.ts` module
- [x] 1.2 Implement `serialiseSession()` — converts page state to `SavedSession` JSON string (Map → entries array, Date stays as-is via JSON default)
- [x] 1.3 Implement `deserialiseSession()` — parses JSON, rehydrates `Date` fields on `RawTransaction.date`, reconstructs `Map` from entries array, validates version
- [x] 1.4 Unit tests for serialise/deserialise round-trip, Date rehydration, Map reconstruction, corrupt JSON handling, version mismatch rejection

## 2. Persistence hook

- [x] 2.1 Create `useSessionPersistence` hook in `src/hooks/use-session-persistence.ts` — accepts current state, returns `{ savedSession, restore, discard }`, reads on mount, debounced writes (~1s) on state change
- [x] 2.2 Handle localStorage quota errors gracefully (silent catch on write)
- [x] 2.3 Unit tests for the hook: mount with existing session, mount with no session, mount with corrupt data, debounced write behaviour

## 3. Integrate into page.tsx

- [x] 3.1 Capture original filename from `handleFileSelect` and store in component state
- [x] 3.2 Wire `useSessionPersistence` into `page.tsx` — pass current state (transactions, categoryMap, catStatus, filename) as input
- [x] 3.3 Add clear calls: `handleReset` clears session, `handleExport` clears session, `handleFileSelect` replaces session
- [x] 3.4 Persist only when `catStatus === "done"` (skip saving during loading/error/idle states)

## 4. Resume banner UI

- [x] 4.1 Add resume banner JSX in the upload step — conditionally rendered when `savedSession` exists, showing filename, transaction count, and relative timestamp
- [x] 4.2 Wire "Resume" button to call `restore()`, hydrate state, and set `step = "review"`
- [x] 4.3 Wire "Discard" button to call `discard()` (removes localStorage key)

## 5. End-to-end verification

- [x] 5.1 Manual test: upload CSV → review → refresh page → see resume banner → click Resume → verify state restored
- [x] 5.2 Manual test: upload CSV → review → Start Over → verify no resume banner on upload page
- [x] 5.3 Manual test: upload CSV → review → Export → verify session cleared
- [x] 5.4 Verify `npm run build` succeeds (no type errors, no dead code)
