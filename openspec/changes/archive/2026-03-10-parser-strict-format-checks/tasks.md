## 1. Type Changes

- [x] 1.1 Change return type of all cleaner functions (`cleanPOS`, `cleanMST`, `cleanICT`, `cleanITR`) from `CleanedFields` to `CleanedFields | null`

## 2. Add Format Validation to Cleaners

- [x] 2.1 Add full regex validation to `cleanPOS` — validate ref1 matches `NETS QR PAYMENT <REF>` and ref2 matches `TO: <MERCHANT>`; return `null` on mismatch
- [x] 2.2 Add full regex validation to `cleanMST` — validate ref1 contains acquirer/country/date suffix pattern; return `null` on mismatch
- [x] 2.3 Add full regex validation to `cleanICT` — validate all ref fields for each sub-type (PayNow out/in, external bank out); return `null` when no sub-type matches (incoming external bank has no defined pattern, so it falls to catch-all)
- [x] 2.4 Add full regex validation to `cleanITR` — validate ref fields for each sub-type (PayLah! withdrawal/top-up, outgoing DBS with OTHR prefix, incoming with `:IB` suffix); return `null` when no sub-type matches fully

## 3. Catch-All Fallback

- [x] 3.1 Replace the `parse()` switch + default branch with a single catch-all pattern: wrap cleaners in an IIFE using `??` to produce `{ payee: "Unknown Format", notes: "" }` for any `null` result or unknown code

## 4. Tests

- [x] 4.1 Add test cases for each cleaner verifying `null` is returned when format validation fails (at least one rejection scenario per cleaner)
- [x] 4.2 Add test cases for the catch-all fallback — unknown code produces "Unknown Format", known code with bad format produces "Unknown Format"
- [x] 4.3 Update existing DBS parser tests to align with new behaviour (ensure valid-format tests still pass, update any tests relying on the old `titleCase(description)` default)
