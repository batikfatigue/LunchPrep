# LunchPrep - Product Requirements Document

## 1. Executive Summary
LunchPrep is an open-source web application that converts Singapore bank statement CSVs (starting with DBS) into Lunch Money-compatible import files. It uses Gemini AI to intelligently categorise each transaction, dramatically reducing manual expense tracking effort.

The app handles parsing, cleaning, anonymising, and categorising transactions, ensuring financial privacy by keeping data client-side.

## 2. Mission & Principles
**Mission:** Make personal expense tracking effortless by bridging the gap between raw bank statements and structured financial tools.

1. **Privacy-first** — Data processed client-side. Anonymised AI calls. No server storage.
2. **Minimal effort** — Convert Bank CSV to a Lunch Money import file in under 2 minutes.
3. **Transparency** — Users can review and adjust the categorized data before downloading the final import file.
4. **Extensibility** — Built to support more banks (OCBC, UOB) in the future.

## 3. Core MVP Scope
- **DBS CSV Support**: Full parsing and cleaning for DBS-specific transaction codes.
- **AI Categorisation**: Smart merchant mapping via Gemini 2.5 Flash-Lite.
- **Privacy Protections**: PII substitution (replacing real names, account numbers, etc. with realistic mock PII). This provides the AI with believable context for highest-accuracy categorization while strictly preventing sensitive data leakage. The original PII is preserved client-side and seamlessly restored into the final import file.
- **Review Step**: Editable table to verify categories and merchant names.
- **Output File**: A clean, valid Lunch Money-compatible CSV ready for import.
- **BYOK Support**: Option for users to use their own Gemini API keys.

## 4. Target Audience & User Stories

**Target Audience:** Users who find manual expense tracking tedious but refuse to connect third-party apps directly to their bank accounts due to security/privacy concerns. They are willing to expend a little manual effort (uploading a CSV) in exchange for total control over their data.

- **Efficiency**: "I want to automate the bulk of my expense tracking without having to manually log every single transaction one by one."
- **Privacy & Control**: "I want the convenience of AI categorization, but I need my financial data to stay private and ensure all PII is stripped before any AI processing."
- **Accuracy**: "I want an AI tool that can categorise accurately and is reliable."
---

## Technical References
For implementation details, refer to:
- **[architecture.md](./architecture.md)**: System design and patterns.
- **[specs/bank-parsing.md](../specs/bank-parsing.md)**: Deep dive into parser rules.
- **[specs/ai-categorisation.md](../specs/ai-categorisation.md)**: AI and anonymisation logic.
- **[specs/export.md](../specs/export.md)**: Export format requirements.
- **[todo.md](./todo.md)**: Active development tasks.
