# LunchPrep - Product Requirements Document

## 1. Executive Summary
LunchPrep is an open-source web application that converts Singapore bank statement CSVs (starting with DBS) into Lunch Money-compatible import files. It uses Gemini AI to intelligently categorise each transaction, dramatically reducing manual expense tracking effort.

The app handles parsing, cleaning, anonymising, and categorising transactions, ensuring financial privacy by keeping data client-side.

## 2. Mission & Principles
**Mission:** Make personal expense tracking effortless by bridging the gap between raw bank statements and structured financial tools.

1. **Privacy-first** — Data processed client-side. Anonymised AI calls. No server storage.
2. **Minimal effort** — Bank CSV to export in under 2 minutes.
3. **Transparency** — Users can review data before export.
4. **Extensibility** — Built to support more banks (OCBC, UOB) in the future.

## 3. Core MVP Scope
- **DBS CSV Support**: Full parsing and cleaning for DBS-specific transaction codes.
- **AI Categorisation**: Smart merchant mapping via Gemini 2.5 Flash-Lite.
- **Privacy Protections**: Personal name anonymisation and PII stripping.
- **Review Step**: Editable table to verify categories and merchant names.
- **Export**: Valid Lunch Money CSV output.
- **BYOK Support**: Option for users to use their own Gemini API keys.

## 4. User Stories
- **Efficiency**: "I want to upload my statement and have it ready for Lunch Money without manual reformatting."
- **Clarity**: "I want to see 'McDonald's' instead of cryptic bank codes."
- **Privacy**: "I want my financial data to stay private and names to be hidden from the AI."
- **Customization**: "I want to use my own Lunch Money categories."

---

## Technical References
For implementation details, refer to:
- **[architecture.md](./architecture.md)**: System design and patterns.
- **[specs/bank-parsing.md](../specs/bank-parsing.md)**: Deep dive into parser rules.
- **[specs/ai-categorisation.md](../specs/ai-categorisation.md)**: AI and anonymisation logic.
- **[specs/export.md](../specs/export.md)**: Export format requirements.
- **[todo.md](./todo.md)**: Active development tasks.
