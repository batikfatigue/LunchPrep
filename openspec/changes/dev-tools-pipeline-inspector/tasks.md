## 1. Type Definitions

- [ ] 1.1 Create `src/lib/pipeline-snapshot.ts` with `GeminiSentEntry` type (`{ index, payee, notes, transactionType }`) and `PipelineSnapshot` type (optional keys for `parsed`, `anonymised`, `sent`, `categorised`, `restored`)
- [ ] 1.2 Write unit tests for `PipelineSnapshot` type shape — partial snapshot, full snapshot, `sent` stage using `GeminiSentEntry[]` not `RawTransaction[]`

## 2. Snapshot Capture in page.tsx

- [ ] 2.1 Add `snapshots` state (`useState<PipelineSnapshot>({})`) and `selectedIndex` state (`useState<number | null>(null)`) to `page.tsx`
- [ ] 2.2 In `triggerCategorise`, reset `snapshots` to `{}` at entry, then capture each stage by spreading into snapshot state: `parsed` after parse, `anonymised` after `anonymise()`, `categorised` after `callCategorise` returns (before restore), `restored` after `restore()`
- [ ] 2.3 Capture `sent` stage by calling `buildPrompt()` on the anonymised transactions, gated by `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'` to avoid double-calling in production
- [ ] 2.4 Reset `snapshots` and `selectedIndex` in `handleReset`
- [ ] 2.5 Comment each touch with `// Dev-tools: pipeline-inspector`

## 3. Row Selection in TransactionTable

- [ ] 3.1 Add optional `onRowSelect?: (index: number) => void` and `selectedIndex?: number | null` props to `TransactionTable`
- [ ] 3.2 Attach `onClick` handler to each table row that calls `onRowSelect` with the transaction's index
- [ ] 3.3 Apply a visual highlight style to the row matching `selectedIndex`
- [ ] 3.4 Pass `onRowSelect={setSelectedIndex}` and `selectedIndex` from `page.tsx` to `TransactionTable`

## 4. Pipeline Inspector Component

- [ ] 4.1 Create `src/dev-tools/pipeline-inspector/index.tsx` accepting `snapshots: PipelineSnapshot` and `selectedIndex: number | null` props
- [ ] 4.2 Render placeholder when `snapshots` is empty (no pipeline run) or `selectedIndex` is null (no row clicked)
- [ ] 4.3 Implement stage table — rows in pipeline order (`parsed → anonymised → sent → categorised → restored`), columns: `payee`, `notes`, `category`; skip absent stages
- [ ] 4.4 Implement field-level diff markers — compare each cell value to the same field in the previous stage row; no markers on the first row (`parsed`)
- [ ] 4.5 Display selected transaction label (index + payee from `restored`, falling back to `parsed`)

## 5. Mount in page.tsx

- [ ] 5.1 Add gated dynamic import for `PipelineInspector` (Pattern B: `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true' ? dynamic(...) : null`)
- [ ] 5.2 Render `<PipelineInspector snapshots={snapshots} selectedIndex={selectedIndex} />` below the transaction table when component is non-null

## 6. Tests

- [ ] 6.1 Unit test: diff marker logic returns true when field differs from previous stage, false when unchanged, never true for first stage
- [ ] 6.2 Unit test: inspector renders placeholder when no snapshot or no selection
- [ ] 6.3 Unit test: `sent` stage entries contain only `index`, `payee`, `notes`, `transactionType` fields

## 7. Verification

- [ ] 7.1 Run `npm run build` and confirm no `src/dev-tools/` references in the production bundle
- [ ] 7.2 Smoke test in dev: upload a DBS CSV, click a transaction row, confirm all five stages appear with correct diff markers on `anonymised` and `restored` rows
