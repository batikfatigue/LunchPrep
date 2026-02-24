# Spec: Bank CSV Parsing

## Input
- File: `.csv` only, read client-side via PapaParse
- Bank auto-detected from CSV headers via parser registry

## DBS Format
- Skip rows 1–6 (account/balance headers); row 7 = column headers
- Columns: `Transaction Date | Transaction Code | Description | Ref1 | Ref2 | Ref3 | Status | Debit Amount | Credit Amount`
- Date: `23 Feb 2026` → `2026-02-23`
- Amounts: Debit = negative, Credit = positive; round to 2 d.p.

## Cleaning Rules

| Code | Type | Rule |
|---|---|---|
| `POS` | NETS QR | Strip `NETS QR PAYMENT <ref> TO: `, keep merchant name |
| `MST` | Mastercard | Take text before `SI SGP`; strip card number (`\d{4}-\d{4}-\d{4}-\d{4}`) and trailing ref |
| `ICT` | PayNow / iBanking | Extract name after `From:`/`To:`, preserve `OTHR` text as notes |
| `ITR` | PayLah! | Label as `PayLah!`; strip phone number and transaction ref |

PII stripped from all types: card numbers, NETS/PayNow/PayLah! reference numbers, date suffixes (e.g. `SI SGP 18FEB`).

## Transformations

| Raw DBS Description | Cleaned Payee | Notes |
|---|---|---|
| `NETS QR PAYMENT 605412025689703 TO: CHICKEN RICE KITCHEN` | Chicken Rice Kitchen | — |
| `MCDONALD'S (KAL) SI SGP 18FEB 1234-5678-9012-3456 000002107332371` | McDonald's (Kal) | — |
| `BUS/MRT 799701767 SI SGP 14FEB 1234-5678-9012-3456 …` | Bus/MRT | — |
| `Incoming PayNow Ref 5891733 From: NG SOO IM OTHR PayNow transfer` | Ng Soo Im | PayNow transfer |
| `PayNow Transfer 5320167 To: YONG GUANG SEAFOOD HG PTE. LTD. OTHR san lor horfun` | Yong Guang Seafood | san lor horfun |
| `SEND BACK FROM PAYLAH! : 82765694 TF675051…` | PayLah! Received | — |
| `Trus:1234567890:I-BANK Transfer OTHR 1771…` | iBanking Transfer | — |
