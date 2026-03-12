## 1. Extract shared buildCsv utility

- [x] 1.1 Create `src/dev-tools/pipeline-inspector/mock-csv.ts` with the `buildCsv` function extracted from `tests/parsers/dbs.test.ts`. Update it to derive the Description column by concatenating `ref1 + ' ' + ref2 + ' ' + ref3`.
- [x] 1.2 Update `tests/parsers/dbs.test.ts` to import `buildCsv` from `@/dev-tools/pipeline-inspector/mock-csv` and remove the inline implementation.
- [x] 1.3 Run existing tests to confirm nothing breaks after the extraction.

## 2. Update inspector props

- [x] 2.1 Add `categories` (string[]) and `apiKey` (string) to `PipelineInspectorProps` in `src/dev-tools/pipeline-inspector/index.tsx`.
- [x] 2.2 Update the `PipelineInspectorDevTool` usage in `src/app/page.tsx` to pass `categories` and `apiKey` props.

## 3. Sandbox input component

- [x] 3.1 Create `src/dev-tools/pipeline-inspector/sandbox-input.tsx` with the form: Transaction Code dropdown (POS/MST/ICT/ITR), Ref1/Ref2/Ref3 text inputs, Debit/Credit numeric inputs, Date text input (defaulting to today in DBS format).
- [x] 3.2 Implement the Execute action with a run mode selector (Parse + Anonymise / Full Pipeline) and a Clear button.
- [x] 3.3 Implement Parse + Anonymise execution: call `buildCsv` → `dbsParser.parse()` → `anonymise()`, build a partial `PipelineSnapshot` (parsed + anonymised stages), and return it via an `onExecute` callback.
- [x] 3.4 Implement Full Pipeline execution: extend Parse + Anonymise with `callCategorise()` → `restore()`, build a full `PipelineSnapshot` (all 7 stages), and return the assigned category via callback.

## 4. Inspector integration

- [x] 4.1 Add sandbox state management to `index.tsx`: a `sandboxSnapshot` state that, when populated, overrides the `snapshots` prop for the stage diff table.
- [x] 4.2 Compose `SandboxInput` above the stage diff table in the inspector layout.
- [x] 4.3 Implement Clear: null out `sandboxSnapshot` to restore the previously selected real transaction.
- [x] 4.4 Add the API Result Panel below the stage diff table — shows the Gemini-assigned category when sandbox runs in Full Pipeline mode. Hidden otherwise.

## 5. Testing

- [x] 5.1 Add unit tests for `mock-csv.ts`: verify `buildCsv` produces valid DBS CSV with correct Description derivation.
- [x] 5.2 Add unit tests for `sandbox-input.tsx`: form rendering, default values, Execute callback with correct snapshot shape.
- [x] 5.3 Add unit tests for inspector integration: sandbox snapshot overrides real snapshot, Clear restores previous state, API Result Panel visibility.
- [x] 5.4 Run `npm run build` to verify production isolation — no dev-tools code leaks into the production bundle.

## 6. Cleanup

- [x] 6.1 Update `docs/todo.md` with completed task and any discovered sub-tasks.
