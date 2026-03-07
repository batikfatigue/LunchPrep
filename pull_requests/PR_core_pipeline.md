## Description
This PR implements the core data pipeline for processing bank CSVs into the Lunch Money format. It introduces the `BankParser` and `RawTransaction` interfaces, the DBS specifically-tailored CSV parser (configured with PII-stripping and robust data-cleaning rules), the format registry for auto-detecting bank files, and the exporter for generating the final Lunch Money CSV.

## Changes
- **Core Interfaces:** Added `RawTransaction` and `BankParser` types (`src/lib/parsers/types.ts`).
- **DBS Parser:** Implemented `dbs.ts` to parse DBS statements, clean complex edge cases across POS, MST, ICT, and ITR transaction types, and dynamically strip PII.
- **Parser Registry:** Added `registry.ts` to auto-detect CSV provenance and delegate to the appropriate parser.
- **CSV Exporter:** Implemented `lunchmoney.ts` to convert standardized transactions into output CSV format and handle browser downloads.
- **Dependencies:** Added `papaparse` for robust CSV processing (`package.json`, `package-lock.json`).
- **Testing:** Created unit and validation tests for `dbs.test.ts` and `lunchmoney.test.ts` verifying logic using the `sample_input.csv` fixture.
- **Documentation:** Updated `docs/todo.md` progress, initialized Core Pipeline PRP, and bumped copyright year in `README.md`.

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Refactor
- [x] Documentation

## Testing
- Verified output parsed correctly against all realistic transaction row edge cases in the sample data fixture.
- Ensured CSV Exporter mapping accurately constructs correct field headers, numerical precision, and date formatting.
- `npm test` runs successfully for all parser and exporter Vitest suites.

## Screenshots (if UI changes)
*(Not applicable)*
