# DBS Transaction Format Reference

These are for only known formats. There are many more formats that we have not seen yet.

Reference of how DBS structures the `Ref1`, `Ref2`, and `Ref3` CSV columns for each transaction code and sub-type. Use this when writing or updating parser cleaning rules.

- DBS may change these formats at any time. Last verified 25 Feb 2026.
- `Description` is always `Ref1 + ' ' + Ref2 + ' ' + Ref3` concatenated.
- Placeholders like `<REF>` denote variable data. Everything else is literal text from DBS.

---

> **Bank transfers (ITR and ICT):** The bank name in these transactions is the transfer intermediary, not the actual recipient. For example, a transfer to WeBull may show `DBS`, a transfer to Gemini may show `Xfer`, and a transfer to Coinbase may show `SCL`. The true counterparty is not available in the CSV — user input notes may hint at it.

## ITR (DBS-to-DBS Bank Transfers)

| Sub-type | Ref 1 | Ref 2 | Ref 3 |
|---|---|---|---|
| Incoming DBS-to-DBS (Account Transfer) | `<REF>` | `<ACCOUNT>:IB` | |
| Outgoing DBS-to-DBS (Account Transfer) | `DBS:I-BANK` | `<ACCOUNT>` | `OTHR <NOTES> <REF>` |
| PayLah! withdrawal | `SEND BACK FROM PAYLAH! :` | `<PHONE>` | `<REF>` |
| PayLah! top-up | `TOP UP TO PAYLAH! :` | `<PHONE>` | `<REF>` |

- User input notes appear after the `OTHR` prefix, before the trailing reference number.


## ICT (Interbank Transfers)

| Sub-type | Ref 1 | Ref 2 | Ref 3 |
|---|---|---|---|
| Outgoing PayNow | `PayNow Transfer <REF>` | `TO: <NAME>` | `OTHR <NOTES>` |
| Incoming PayNow | `Incoming PayNow Ref <REF>` | `From: <NAME>` | `OTHR <NOTES>` |
| Outgoing Interbank (Account Transfer) | `<BANK>:<ACCOUNT>:I-BANK` | `<NOTES>` | `<PURPOSE CODE> <REF>` |
| Incoming Interbank (Account Transfer) | *(Ref fields are usually unmeaningful alphanumeric strings)* | | |

- Default PayNow placeholder note is `PayNow transfer`.
- For outgoing Interbank (Account Transfer), user input note is in Ref 2 (without an `OTHR` prefix).
- For outgoing Interbank (Account Transfer), `<PURPOSE CODE>` is the user manually input short 4-letters long code describing the transfer purpose (see [fast_purpose_codes.json](../src/lib/parsers/data/fast_purpose_codes.json)). Default is `OTHR`.
- Default outgoing Interbank (Account Transfer) `<NOTES>` is `Transfer`.
- DBS truncates `INTC` to `INT` possibly due to a typo.
- `<BANK>` is a truncated name of the receiving bank/transfer partner (e.g. `Trus` = Trust Bank, `Xfer` = Xfers, `SCL` = Standard Chartered Bank (Singapore) Limited).

## MST / UPI / UMC / UMC-S (Card Payments)

| Sub-type | Ref 1 | Ref 2 | Ref 3 |
|---|---|---|---|
| Card payment | `<MERCHANT> [<MERCHANT-REF>] <ACQUIRER-CODE> <COUNTRY> <DATE>` | `<CARD>` | `<DBS-REF>` |

- `<MERCHANT-REF>` is an optional unmeaningful alphanumeric string.
- `<ACQUIRER-CODE> <COUNTRY>` is a short code + 3-letter country (e.g. `SI SGP`, `St SWE`).
- `<CARD>` format: `XXXX-XXXX-XXXX-XXXX`. `<DATE>` format: `14FEB`.

## POS (NETS QR Payments)

| Sub-type | Ref 1 | Ref 2 | Ref 3 |
|---|---|---|---|  
| NETS QR payment | `NETS QR PAYMENT <REF>` | `TO: <MERCHANT>` | – |
