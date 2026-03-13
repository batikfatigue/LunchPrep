## Requirements

### Requirement: Parse DBS debit/credit amounts with correct sign convention
The parser SHALL return a **negative** number for debit (expense) transactions and a **positive** number for credit (income) transactions, rounded to 2 decimal places.

#### Scenario: Debit transaction parsed
- **WHEN** the `Debit Amount` column is non-empty and `Credit Amount` is empty
- **THEN** `parseAmount()` returns a negative number equal to the debit value rounded to 2 d.p.

#### Scenario: Credit transaction parsed
- **WHEN** the `Credit Amount` column is non-empty and `Debit Amount` is empty
- **THEN** `parseAmount()` returns a positive number equal to the credit value rounded to 2 d.p.

#### Scenario: Neither column populated
- **WHEN** both `Debit Amount` and `Credit Amount` are empty
- **THEN** `parseAmount()` throws an error
