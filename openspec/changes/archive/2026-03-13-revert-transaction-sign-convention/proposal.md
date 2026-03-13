## Why

A previous change inverted the sign convention for transaction amounts in the DBS parser: debits (expenses) are returned as positive numbers and credits (income) as negative, which is the opposite of the Lunch Money CSV contract and the intended UI behaviour. This must be reverted to restore correctness.

## What Changes

- `parseAmount()` in `src/lib/parsers/dbs.ts` will return **negative** values for debits and **positive** values for credits (restoring the original, correct convention).
- No changes to the exporter or display layer — they already expect the correct sign convention.

## Capabilities

### New Capabilities
<!-- None introduced -->

### Modified Capabilities
- `bank-parsing`: The sign of parsed debit/credit amounts is reverting to the correct convention (negative = debit/expense, positive = credit/income).

## Impact

- `src/lib/parsers/dbs.ts` — `parseAmount()` function
- `src/lib/__tests__/` and any parser tests asserting on amount signs must be updated to match the corrected values
- No UI, exporter, or API changes required — downstream code already assumes the correct convention
