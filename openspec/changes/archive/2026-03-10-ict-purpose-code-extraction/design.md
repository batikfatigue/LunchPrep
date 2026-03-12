## Context

The `cleanICT` function in `src/lib/parsers/dbs.ts` handles four ICT sub-types. The outgoing interbank (account transfer) branch currently validates Ref3 with a hardcoded `OTHR` prefix check, based on an incorrect assumption that Ref3 is always `OTHR <REF>`. The updated format reference (`docs/dbs_formats.md`) shows Ref3 is actually `<PURPOSE CODE> <REF>`, where the purpose code is a user-selected FAST code that defaults to `OTHR` but can be any valid code from `fast_purpose_codes.json`.

## Goals / Non-Goals

**Goals:**
- Accept all valid FAST purpose codes in Ref3 for outgoing interbank ICT transactions
- Extract and resolve purpose codes into human-readable labels
- Surface resolved purpose labels in the Notes field (purpose-first, pipe-delimited)
- Handle the `INT` DBS exception (3-letter code mapping to Intra Company Payment)
- Suppress `OTHR` as it carries no user intent (default value)

**Non-Goals:**
- Modifying any other ICT sub-type (PayNow in/out, incoming interbank)
- Changing the `fast_purpose_codes.json` data file
- Adding `INT` to `fast_purpose_codes.json` (it's a DBS-specific anomaly, not a standard FAST code)

## Decisions

### 1. Purpose code resolution strategy

**Decision:** Three-tier resolution — hardcoded exception → JSON lookup → warn + suppress.

```
resolvePurposeCode(code):
  "INT"           → "Intra Company Payment"     (hardcoded DBS exception)
  "OTHR"          → null                         (suppress, default/no intent)
  in JSON lookup  → resolved label               (e.g. "SALA" → "Salary Payment")
  not found       → null + console.warn          (suppress, unknown code)
```

**Why:** `INT` is a strict one-off DBS anomaly (should be `INTC` per FAST standard) — hardcoding avoids polluting the canonical FAST codes file. `OTHR` suppression avoids noise from the unmodified default. Unknown codes warn for observability without rejecting structurally valid transactions.

### 2. Ref3 validation pattern

**Decision:** Accept `INT` (exactly 3 alpha chars) or any 4 alpha chars, followed by a space. Reject otherwise.

```
/^(INT|[A-Z]{4})\s/i
```

**Why:** FAST purpose codes are strictly 4 letters. `INT` is the only known 3-letter exception from DBS. A flexible range (3-5 chars) would weaken validation for no known benefit.

### 3. Notes format — purpose-first, pipe-delimited

**Decision:** When a purpose label is resolved, prepend it to any existing ref2 notes with ` | ` delimiter.

| Purpose resolved | Ref2 notes | Result |
|---|---|---|
| `"Salary Payment"` | `"Monthly transfer"` | `"Salary Payment \| Monthly transfer"` |
| `"Salary Payment"` | `""` | `"Salary Payment"` |
| `null` (suppressed) | `"Monthly transfer"` | `"Monthly transfer"` |
| `null` (suppressed) | `""` | `""` |

**Why:** Purpose-first puts the structured, machine-resolved label before the freeform user note. Pipe delimiter visually separates the two data sources without ambiguity.

### 4. Helper function placement

**Decision:** Add a `resolvePurposeCode` helper in `dbs.ts` alongside the existing `cleanICTNotes` helper.

**Why:** Purpose code resolution is DBS-specific logic (especially the `INT` exception). It doesn't belong in a shared utility. Keeping it next to `cleanICT` maintains locality.

## Risks / Trade-offs

- **[Risk] Unknown purpose codes silently suppressed** → Mitigated by `console.warn` for observability. If a new valid code appears frequently, it can be added to `fast_purpose_codes.json`.
- **[Risk] `INT` exception is fragile** → Mitigated by strict matching (exact string, not a pattern). If DBS fixes the typo to `INTC`, the standard lookup path handles it automatically.
