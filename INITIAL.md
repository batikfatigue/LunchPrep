## FEATURE:
Implement Phase 2: AI Integration for transaction categorisation. Expected deliverables include:
1. **Name Anonymisation**: Build a client-side privacy step that detects personal names in transfer transaction codes (`ICT`, `ITR`), excludes business entities, builds an in-memory mapped placeholder list with semantic replacements, and masks them before sending to the AI. Restores the real names upon returned final data.
2. **Gemini Proxy**: Implement `POST /api/categorise` (`src/app/api/categorise/route.ts`) proxy route for the `gemini-2.5-flash-lite` model using temperature `0.0` and structured JSON schema output to guarantee exact output array typing (e.g., `[{ index, category }]`). Implement IP-based rate limiting of 10 RPM. 
3. **UI Enhancements**: Add a category dropdown to the transaction review table pulling defaults from `src/lib/categoriser/categories.ts`. Handle loading spinners and show manual fallback UI when the API fails.
4. **Testing**: Write Vitest unit tests for name anonymisation matching/restoration and the prompt builder format generation.

## EXAMPLES:
- There is no `examples/` folder for this step yet, but follow the existing unit test patterns found in `src/lib/parsers/` and `src/lib/exporter/` for writing the new AI categoriser unit tests. Maintain immutable, pure function patterns to stay consistent.

## DOCUMENTATION:
- AI Categorisation Specifications: `specs/ai-categorisation.md`
- Project Roadmap & Checklist: `docs/todo.md` (See Phase 2 section)
- Vercel Next.js Route Handlers: For `/api/categorise` implementation.
- Google Gemini SDK Structured Outputs: Leverage `@google/generative-ai` guidelines for enforcing `responseSchema` for JSON schema array returns.

## OTHER CONSIDERATIONS:
- **Anonymisation Strategy**: Card and NETS transactions (`POS`, `MST`, `UMC`) must intentionally bypass the anonymiser completely so authentic merchant names reach the AI for proper context.
- **BYOK (Bring Your Own Key) Support**: We will support a BYOK setting stored in `localStorage`. Code architecture should foresee conditionally routing direct to the Gemini API from the client instead of calling `/api/categorise` if the token exists.
- **Error & Failure Recovery**: On HTTP `429` (Rate Limited) or HTTP `500` (Gemini SDK failure), the UI must not crash but instead gracefully alert users and allow manual category mapping fallback within the grid interface.
- **Minimising API Calls**: Send all transactions in a single batched prompt rather than one request per row.