## Why

Users reviewing thousands of bank transactions can lose all progress (edits to payee names, notes, assigned categories) if they accidentally refresh the page, close the tab, or trigger a full reload during development. Currently all review state is ephemeral `useState` that resets on any page navigation.

## What Changes

- Persist review-step state (transactions, categoryMap, catStatus, step) to localStorage as a single active session.
- Show a "Resume session" banner on the upload page when a saved session exists, with Resume and Discard options.
- Store session metadata (original filename, transaction count, save timestamp) for the resume banner.
- Auto-clear the saved session on "Start Over", "Export complete", and new CSV upload (replace).
- Rehydrate `Date` objects in `RawTransaction` on restore (JSON serialises Dates as strings).

## Capabilities

### New Capabilities
- `session-persistence`: localStorage-based single-session persistence for the review page, including serialisation/deserialisation, lifecycle management (save, restore, clear), and a resume banner UI on the upload step.

### Modified Capabilities

## Impact

- `src/app/page.tsx` — state initialisation changes from bare `useState` to hydrate-from-localStorage pattern; new clear-on-lifecycle calls; FileUpload handler gains filename capture.
- `src/components/file-upload.tsx` — may need to expose the original filename (currently only passes the `File` object).
- `src/hooks/` — new `useSessionPersistence` hook (or similar) for serialisation, rehydration, and clear logic.
- No new dependencies. No API changes. No breaking changes.
