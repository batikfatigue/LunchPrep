## Why

The outgoing interbank (account transfer) ICT sub-type has a `<PURPOSE CODE> <REF>` structure in Ref3 — not the previously assumed fixed `OTHR <REF>`. The current `cleanICT` logic hardcodes an `OTHR` prefix check, which rejects any transaction where the user selected a different FAST purpose code (e.g. `SALA`, `INVS`, `RENT`). These valid transactions silently fall through to the catch-all as "Unknown Format", losing cleaned payee and notes. Additionally, the purpose code is user-selected meaningful data that should be surfaced in the output.

## What Changes

- Update `cleanICT` outgoing interbank validation to accept any valid FAST purpose code in Ref3 (4 alpha chars), plus a strict exception for DBS's `INT` code (3 chars, maps to Intra Company Payment).
- Extract and resolve the purpose code via `fast_purpose_codes.json` lookup, with `INT` hardcoded as a DBS exception.
- Append the resolved purpose label to the Notes field in purpose-first delimited format (e.g. `Salary Payment | user notes`). Suppress `OTHR` (default, no user intent). Warn on unknown codes and treat as no-op.
- Update the bank-parsing spec's ICT cleaning rules table to reflect the new Ref3 format and notes output.
- Update the format-validation spec scenarios for the ICT external bank outgoing sub-type.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `format-validation`: ICT outgoing interbank scenario changes from requiring `OTHR` prefix to accepting `<PURPOSE CODE>` structure, and adds scenarios for purpose code resolution edge cases.

## Impact

- `src/lib/parsers/dbs.ts` — `cleanICT` function (outgoing interbank branch + new purpose code resolution helper)
- `src/lib/parsers/data/fast_purpose_codes.json` — read-only lookup (no changes to file itself)
- `specs/bank-parsing.md` — ICT cleaning rules table update
- Existing tests for `cleanICT` outgoing interbank will need updating
