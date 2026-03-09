## Context

The pipeline inspector (`src/dev-tools/pipeline-inspector/`) shows a per-transaction
diff table across five stages: `parsed → anonymised → sent → categorised → restored`.
All five stages occur after parsing is complete. The parser itself performs the most
aggressive transformations — Ref field extraction, card number stripping, reference
ID removal, title-casing — but these are invisible to the inspector.

The parser in `dbs.ts` has two sequential steps per transaction:
1. A per-code cleaner (`cleanPOS`, `cleanMST`, `cleanICT`, `cleanITR`) that extracts
   `{ payee, notes }` from the raw Ref1/Ref2/Ref3 fields
2. A general `stripPII(payee)` call that removes card number patterns

The `originalDescription` field already preserves the raw `Ref1 + Ref2 + Ref3`
concatenation. The final `description` field holds the post-`stripPII` result.
The only missing intermediate is the per-code cleaner output before `stripPII` runs.

## Goals / Non-Goals

**Goals:**
- Capture the per-code cleaner's payee output before `stripPII` as a trace field on `RawTransaction`
- Extend the inspector's stage table with three new rows (Raw, After Clean, After StripPII) that precede the existing stages
- Gate trace capture behind `NEXT_PUBLIC_DEV_TOOLS` to avoid allocation in production

**Non-Goals:**
- Refactoring the per-code cleaners to separate extraction, casing, and stripping into discrete steps
- Capturing intermediate steps within `stripPII` itself (e.g. before vs after card number regex)
- Adding new snapshot keys to `PipelineSnapshot` — the parse stages are derived from fields on `RawTransaction` at the existing `parsed` snapshot

## Decisions

### 1. Single `cleanedPayee` field, not a full trace object

The only genuinely new data point is the payee value between the per-code cleaner
and `stripPII`. Notes don't change between these steps — the cleaner returns notes
and they're written directly to the transaction. A single string field is sufficient.

Alternative considered: a richer `ParseTrace` with `{ cleanedPayee, cleanedNotes,
rawRef1, rawRef2, rawRef3 }`. Rejected because `cleanedNotes` always equals
`tx.notes`, raw Refs are already encoded in `originalDescription`, and the extra
fields would add complexity without new information.

### 2. `parseTrace` is optional and dev-gated

The field is typed as `parseTrace?: { cleanedPayee: string }` on `RawTransaction`.
In `dbs.ts`, population is gated behind `process.env.NEXT_PUBLIC_DEV_TOOLS === "true"`.
Production builds never allocate the trace object.

Alternative considered: always populating the field (it's just one string per
transaction). Rejected because `RawTransaction` flows through the entire pipeline
and is serialised to the API route — even a small field adds noise to every
transaction in every context.

### 3. Inspector derives parse stages from existing `parsed` snapshot fields

The three new inspector rows (Raw, After Clean, After StripPII) are derived from
fields already present on each `RawTransaction` in `snapshots.parsed`:
- Raw → `tx.originalDescription`
- After Clean → `tx.parseTrace?.cleanedPayee`
- After StripPII → `tx.description`

No new keys are added to `PipelineSnapshot`. This keeps the snapshot structure
unchanged and avoids adding capture lines to `page.tsx`.

### 4. Inspector stage order and naming

The extended stage sequence is:

```
Raw → After Clean → After StripPII → Anonymised → Sent → Categorised → Restored
```

"Parsed" is removed as a named stage — it was the entry point before, but now
the three parse sub-stages cover the same ground with finer granularity.
"After StripPII" shows the same values that "Parsed" used to show.

### 5. Notes column in parse stages

- Raw: shows `"—"` (notes aren't extractable from `originalDescription` separately)
- After Clean: shows `tx.notes` (the cleaner's output, which is the final value)
- After StripPII: shows `tx.notes` (unchanged from After Clean)

This means the notes column will show a change marker between Raw and After Clean,
then no further changes through the parse stages. This correctly reflects that
notes extraction happens in the per-code cleaner.

## Risks / Trade-offs

**`parseTrace` adds a field to a core type** → The field is optional and typed.
No existing code reads it, so there is no risk of breaking consumers. If the
feature is removed, delete the field and its population in `dbs.ts`.

**`NEXT_PUBLIC_DEV_TOOLS` gate in parser code** → The parser is a library module
that currently has no build-time gating. Adding a single conditional for trace
population is minimal, and follows the same pattern used in `page.tsx` for
snapshot capture. Mitigation: a single `if` block, clearly commented.

**"Parsed" stage removed from inspector** → Existing familiarity with the 5-stage
view changes. Mitigation: "After StripPII" shows identical values to what "Parsed"
showed before, so no information is lost — only the label changes.
