# Spec: Bank CSV Parsing

## Input
- File: `.csv` only, read client-side via PapaParse
- Bank auto-detected from CSV headers via parser registry

## DBS Format
- Skip rows 1–6 (account/balance headers); row 7 = column headers
- Columns: `Transaction Date | Transaction Code | Description | Ref1 | Ref2 | Ref3 | Status | Debit Amount | Credit Amount`
- Date: `23 Feb 2026` → `2026-02-23`
- Amounts: Debit = positive, Credit = negative; round to 2 d.p.

## Transaction Code Lookup 
- `src/lib/parsers/data/dbs_codes.json` — Static JSON dictionary mapping 928 DBS transaction codes to descriptions (e.g., `{"POS": "Point of Sale", "ITR": "Inward Transfer"}`).
- Used to instantly resolve the `Transaction Code` column into a meaningful description for the `transactionCode` field on `RawTransaction`.

## Cleaning Rules

The parser extracts a **payee** and optional **notes** from the raw Ref columns. Each transaction code has sub-types with different formats — see [dbs_formats.md](../docs/dbs_formats.md) for the full raw format reference.

### POS (NETS QR)

| Source | Extract |
|---|---|
| Ref 2 | Strip `TO: ` prefix → **payee** |

### MST / UPI / UMC / UMC-S (Card Payments)

| Source | Extract |
|---|---|
| Ref 1 | Take text before ` <ACQUIRER-CODE> <COUNTRY>`; strip optional trailing merchant ref → **payee** |

### ICT (Interbank Transfers)

| Sub-type | Payee | Notes |
|---|---|---|
| PayNow (outgoing/incoming) | Ref 2: strip `To: ` or `From: ` prefix | Ref 3: strip `OTHR ` prefix; ignore if default `PayNow transfer` |
| External bank (outgoing) | Ref 1: extract `<BANK>` from `<BANK>:<ACCOUNT>:I-BANK` | Ref 2: user input note (no `OTHR` prefix) |
| External bank (incoming) | — | `External iBanking Transfer` (refs are unmeaningful) |

### ITR (DBS-to-DBS Transfers)

| Sub-type | Payee | Notes |
|---|---|---|
| Outgoing transfer | `DBS` | Ref 3: strip `OTHR ` prefix, strip trailing ref |
| Incoming transfer | `DBS` | — |
| PayLah! withdrawal | `PayLah!` | `Received` |
| PayLah! top-up | `PayLah!` | `Top-Up` |

> The bank name (`DBS`, `Trus`, `Xfer`, etc.) may be the actual recipient (e.g. topping up a Trust Bank account) or merely an intermediary (e.g. transferring to WeBull via DBS). The parser cannot distinguish — user notes and AI categorisation resolve the ambiguity.

### PII stripping (all types)

Strip from all fields before output: card numbers (`\d{4}-\d{4}-\d{4}-\d{4}`), phone numbers, account numbers, reference numbers, acquirer/country/date suffixes (e.g. `SI SGP 18FEB`, `St SWE 02OCT`).

## Transformations

| Raw DBS Description | Cleaned Payee | Notes |
|---|---|---|
| `NETS QR PAYMENT 605412025689703 TO: NOODLE HOUSE STALL` | Noodle House Stall | — |
| `BURGER KING (XYZ) SI SGP 18FEB 1234-5678-9012-3456 000002107332371` | Burger King (Xyz) | — |
| `BUS/MRT 799701767 SI SGP 14FEB 1234-5678-9012-3456 …` | Bus/MRT | — |
| `Incoming PayNow Ref 5891733 From: NG SOO IM OTHR PayNow transfer` | Ng Soo Im | PayNow transfer |
| `PayNow Transfer 5320167 To: OCEAN CATCH SEAFOOD PTE. LTD. OTHR san lor horfun` | Ocean Catch Seafood | san lor horfun |
| `SEND BACK FROM PAYLAH! : 82765694 TF675051…` | PayLah! | Received |
| `Trus:1234567890:I-BANK Transfer Top Up Bank 1771…` | Trus | Top Up Bank |
