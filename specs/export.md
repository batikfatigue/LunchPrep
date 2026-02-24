# Spec: Export Format

## Review Table (pre-export)
Editable columns: `Date | Payee | Amount | Category (dropdown) | Notes`
- Debits in red (negative), credits in green (positive)
- Inline edit: payee, notes, category override

## Lunch Money CSV Format
Headers: `date,payee,amount,category,notes`

```csv
date,payee,amount,category,notes
2026-02-23,Chicken Rice Kitchen,-9.30,Dining,
2026-02-21,McDonald's (Kal),-28.45,Dining,
2026-02-21,Ng Soo Im,200.00,Income,PayNow transfer
2026-02-11,Yong Guang Seafood,-6.30,Dining,san lor horfun
```

- `date`: ISO 8601 (`YYYY-MM-DD`)
- `amount`: negative = expense, positive = income
- `category`: must match a Lunch Money category name
- `notes`: PayNow OTHR field contents (preserved as-is)

**Filename:** `lunchprep-export-YYYY-MM-DD.csv`
**Constraints:** Max 3 MB, max 10,000 rows (Lunch Money limits).
