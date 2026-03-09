## 1. Type Definitions

- [x] 1.1 Create `src/lib/pipeline-snapshot.ts` with `GeminiSentEntry` type (`{ index, payee, notes, transactionType }`) and `PipelineSnapshot` type (optional keys for `parsed`, `anonymised`, `sent`, `categorised`, `restored`)
- [x] 1.2 Write unit tests for `PipelineSnapshot` type shape — partial snapshot, full snapshot, `sent` stage using `GeminiSentEntry[]` not `RawTransaction[]`

## 2. Snapshot Capture in page.tsx

- [x] 2.1 Add `snapshots` state (`useState<PipelineSnapshot>({})`) and `selectedIndex` state (`useState<number | null>(null)`) to `page.tsx`
- [x] 2.2 In `triggerCategorise`, reset `snapshots` to `{}` at entry, then capture each stage by spreading into snapshot state: `parsed` after parse, `anonymised` after `anonymise()`, `categorised` after `callCategorise` returns (before restore), `restored` after `restore()`
- [x] 2.3 Capture `sent` stage by calling `buildPrompt()` on the anonymised transactions, gated by `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'` to avoid double-calling in production
- [x] 2.4 Reset `snapshots` and `selectedIndex` in `handleReset`
- [x] 2.5 Comment each touch with `// Dev-tools: pipeline-inspector`

## 3. Row Selection in TransactionTable

- [x] 3.1 Add optional `onRowSelect?: (index: number) => void` and `selectedIndex?: number | null` props to `TransactionTable`
- [x] 3.2 Attach `onClick` handler to each table row that calls `onRowSelect` with the transaction's index
- [x] 3.3 Apply a visual highlight style to the row matching `selectedIndex`
- [x] 3.4 Pass `onRowSelect={setSelectedIndex}` and `selectedIndex` from `page.tsx` to `TransactionTable`

## 4. Pipeline Inspector Component

- [x] 4.1 Create `src/dev-tools/pipeline-inspector/index.tsx` accepting `snapshots: PipelineSnapshot` and `selectedIndex: number | null` props
- [x] 4.2 Render placeholder when `snapshots` is empty (no pipeline run) or `selectedIndex` is null (no row clicked)
- [x] 4.3 Implement stage table — rows in pipeline order (`parsed → anonymised → sent → categorised → restored`), columns: `payee`, `notes`; skip absent stages
- [x] 4.4 Implement field-level diff markers — compare each cell value to the same field in the previous stage row; no markers on the first row (`parsed`)
- [x] 4.5 Display selected transaction label (index + payee from `restored`, falling back to `parsed`)

## 5. Mount in page.tsx

- [x] 5.1 Add gated dynamic import for `PipelineInspector` (Pattern B: `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true' ? dynamic(...) : null`)
- [x] 5.2 Render `<PipelineInspector snapshots={snapshots} selectedIndex={selectedIndex} />` below the transaction table when component is non-null

## 6. Tests

- [x] 6.1 Unit test: diff marker logic returns true when field differs from previous stage, false when unchanged, never true for first stage
- [x] 6.2 Unit test: inspector renders placeholder when no snapshot or no selection
- [x] 6.3 Unit test: `sent` stage entries contain only `index`, `payee`, `notes`, `transactionType` fields

## 7. Verification

- [x] 7.1 Run `npm run build` and confirm no `src/dev-tools/` references in the production bundle
- [x] 7.2 Smoke test in dev: upload a DBS CSV, click a transaction row, confirm all five stages appear with correct diff markers on `anonymised` and `restored` rows
