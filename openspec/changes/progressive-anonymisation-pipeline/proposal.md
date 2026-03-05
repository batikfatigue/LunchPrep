## Why

The current anonymisation logic uses a hardcoded keyword list (negative gate) across all transaction types, causing two problems: merchants without matching keywords get unnecessarily masked (degrading Gemini categorisation accuracy), and personal names containing keywords leak through unmasked (privacy violation). The keyword approach is fundamentally unexhaustive — expanding the list increases collision risk with personal names. This needs to be replaced with a progressive unmasking pipeline that defaults to privacy and recovers merchants with confidence.

## What Changes

- **Replace the keyword-based anonymisation gate** with a channel-aware pipeline: non-P2P transactions (POS, MST, UMC, etc.) bypass anonymisation entirely; P2P transactions (ICT, ITR, and related fund transfer codes) default to masked.
- **Add a deterministic pre-filter** that regex-redacts structured financial identifiers (credit card numbers, bank accounts, NRIC/FIN, phone numbers, alphanumeric reference strings) from all fields before any data leaves the browser.
- **Add notes-based AI classification** (Level 1): send only the `notes` field (no PII) to Gemini to determine if the transaction can be categorised from notes alone, or if the notes suggest a merchant payment.
- **Add syntax heuristics for merchant recovery** (Level 2): for P2P transactions flagged as likely-merchant by Level 1, apply local pattern matching (business name patterns + personal name patterns) to decide whether to unmask the payee.
- **Restructure the anonymise/restore pipeline** in `src/lib/anonymiser/pii.ts` to support the multi-level flow, replacing the current single-pass keyword gate.
- **Update the categorisation API call flow** to support a two-phase approach: notes-only classification first, then full categorisation with recovered merchant names.
- **Update existing tests** to cover the new pipeline levels and remove tests coupled to the old keyword gate behaviour.

## Capabilities

### New Capabilities
- `pii-redaction`: Deterministic regex-based redaction of structured financial identifiers (credit cards, bank accounts, NRIC/FIN, phone numbers, alphanumeric references) from transaction fields before external API calls.
- `progressive-unmasking`: Multi-level merchant recovery pipeline for P2P transactions — notes-based AI classification (Level 1) and syntax heuristics (Level 2) — with masked-by-default semantics.

### Modified Capabilities
- None — the existing anonymisation logic is being replaced, not extended. The new capabilities supersede the current keyword gate.

## Impact

- **`src/lib/anonymiser/pii.ts`**: Major rewrite — replace keyword gate with channel filter + progressive unmasking pipeline. `isBusinessName()` replaced by new pattern matchers. `isTransferTransaction()` expanded to cover additional fund transfer codes (ATR, TRF, TTR, OTRF).
- **`src/app/page.tsx`**: Update `triggerCategorise()` flow to support two-phase categorisation (notes classification → full categorisation).
- **`src/lib/categoriser/client.ts`**: Add notes-only classification call alongside existing full categorisation.
- **`src/lib/categoriser/prompt.ts`**: Add notes classification prompt/system instruction.
- **`src/app/api/categorise/route.ts`**: May need a new endpoint or mode for notes-only classification.
- **`tests/anonymiser/pii.test.ts`**: Rewrite to test new pipeline levels.
- **`src/lib/parsers/types.ts`**: No changes expected — `RawTransaction` already has the required fields (`notes`, `transactionCode`, `originalPII`).
