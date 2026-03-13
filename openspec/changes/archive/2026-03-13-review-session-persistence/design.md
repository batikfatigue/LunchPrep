## Context

All review-step state in `page.tsx` (`step`, `transactions`, `categoryMap`, `catStatus`) is held in ephemeral `useState`. A full page reload wipes everything, forcing users to re-upload and re-categorise. Only `categories` and `apiKey` survive via the existing `useLocalStorage` hook.

The existing `useLocalStorage` hook (`src/hooks/use-local-storage.ts`) handles SSR-safe hydration with an `isHydrated` ref guard, and writes back on every state change. It serves as a proven pattern to build on.

## Goals / Non-Goals

**Goals:**
- Survive page refreshes, tab crashes, and dev-server full reloads without losing review progress.
- Single active session — one saved state at a time, replaced on new upload.
- Clean lifecycle: auto-clear on "Start Over", "Export complete", and new CSV upload.
- Resume banner on the upload page when a saved session exists.

**Non-Goals:**
- Multi-session history or session switching UI.
- Persisting dev-tools pipeline inspector state (`snapshots`, `selectedIndex`, `reviewMap`) — separate future change.
- Export/import session files.
- Encryption or obfuscation of stored data.

## Decisions

### 1. Single localStorage key with a session envelope

Store all session state under one key (`lunchprep_session`) as a JSON object:

```ts
interface SavedSession {
  /** Metadata for the resume banner. */
  meta: {
    filename: string;       // original CSV filename
    txnCount: number;       // transaction count
    savedAt: string;        // ISO 8601 timestamp
  };
  /** Serialised page state. */
  state: {
    transactions: RawTransaction[];  // Dates as ISO strings
    categoryMap: [number, string][]; // Map serialised as entries
    catStatus: "done";               // only persist when done
  };
}
```

**Why single key over per-field keys:** Atomic read/write — no partial state corruption if the write is interrupted. Also simpler to clear (`removeItem` once).

**Why not reuse `useLocalStorage` directly:** The existing hook is great for simple values but doesn't handle Date rehydration, Map serialisation, or the "only persist when catStatus is done" rule. A dedicated `useSessionPersistence` hook keeps these concerns contained without complicating the generic hook.

### 2. Date rehydration via explicit reviver

`JSON.parse` with a reviver function that converts ISO 8601 date strings back to `Date` objects for the `RawTransaction.date` field. Applied during restore, not globally.

**Alternative considered:** Store dates as epoch numbers. Rejected because the rest of the codebase uses `Date` objects and ISO strings are human-readable in DevTools.

### 3. Map ↔ Array<[K, V]> serialisation

`categoryMap` is `Map<number, string>`. Serialise as `Array.from(map.entries())`, restore with `new Map(entries)`.

### 4. Debounced writes

Write to localStorage on a trailing debounce (~1s) rather than on every state change. The user may rapid-fire edits (payee name typing, category dropdown changes) and we don't want to thrash storage.

**Why 1s:** Fast enough that a surprise refresh loses at most 1 second of work. Slow enough to batch rapid edits.

### 5. Resume banner as a conditional block in the upload step

When `step === "upload"` and a valid saved session exists in localStorage, render a banner above the file upload zone with:
- Filename, transaction count, and relative timestamp ("2 hours ago").
- **Resume** button → hydrate state, jump to `step = "review"`.
- **Discard** button → clear localStorage, stay on upload.

No new route or component file needed — this is a small conditional block inside the existing upload step JSX in `page.tsx`. If it grows, extract to a component.

### 6. Lifecycle clear points

| Event | Action |
|---|---|
| New CSV uploaded | Replace session (new data overwrites old) |
| "Start Over" clicked | `localStorage.removeItem("lunchprep_session")` |
| Export complete (step → "export") | `localStorage.removeItem("lunchprep_session")` |
| Manual category/payee/notes edit | Debounced save (updates session) |

## Risks / Trade-offs

- **localStorage 5MB limit** → 1000 transactions ≈ 0.5–1MB serialised. Unlikely to hit the limit for typical bank statements. If `setItem` throws a quota error, silently degrade (no persistence) rather than crash.
- **Stale session after app update** → If we change `RawTransaction` shape in a future release, old sessions may fail to deserialise. Mitigation: add a `version` field to `SavedSession` and discard sessions with mismatched versions.
- **Date rehydration correctness** → Only `RawTransaction.date` needs rehydration. The reviver targets this specific field path rather than aggressively converting all date-like strings.
