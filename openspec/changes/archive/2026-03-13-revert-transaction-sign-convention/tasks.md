## 1. Fix parseAmount() sign convention

- [x] 1.1 In `src/lib/parsers/dbs.ts`, update `parseAmount()` to return a negative value for debits (`-Math.round(parseFloat(debit) * 100) / 100`) and a positive value for credits (`Math.round(parseFloat(credit) * 100) / 100`)

## 2. Update spec documentation

- [x] 2.1 In `specs/bank-parsing.md`, correct the Amounts line to read: `Debit = negative, Credit = positive; round to 2 d.p.`

## 3. Update tests

- [x] 3.1 Audit all test files that assert on `.amount` values (e.g. `src/dev-tools/pipeline-inspector/__tests__/export.test.ts`, `src/lib/__tests__/pipeline-snapshot.test.ts`, `src/lib/__tests__/session.test.ts`) and confirm they use correct sign conventions (debits negative, credits positive); update any assertions that relied on the inverted behavior
- [x] 3.2 Add a unit test for `parseAmount()` directly in a new `src/lib/parsers/__tests__/dbs.test.ts` covering: debit returns negative, credit returns positive, neither throws

## 4. Verify

- [x] 4.1 Run `npm test` and confirm all tests pass
