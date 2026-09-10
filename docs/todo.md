# Roadmap

## Completed

- [x] Pipeline sandbox — mock transaction input form in the pipeline inspector for testing edge cases (dev-tools-pipeline-sandbox)
- [x] Consolidate categorisation debugger into pipeline inspector (reasoning, payload, annotations → API Result Panel)
- [x] UI/UX redesign — app shell with numbered step pills + settings dialog, upload hero with flow diagram/format select/privacy + AI mode cards, review table with filter chips/search/selection/sorting/pagination, export summary screen
- [x] OpenAI-compatible API provider support — `AI_PROVIDER`/`OPENAI_*` env vars for the server proxy and a provider picker (key + base URL + model) for BYOK
- [x] OpenAI-compatible hardening — tolerant JSON parsing (fences/prose/content parts), `/chat/completions` URL normalisation, HTTP 400 retry without `response_format`, real provider error surfaced in the review banner, proxy/BYOK radio actually controls routing

## Discovered During Work

- [ ] `anonymise()` on single-transaction arrays may produce different results than batch — consider documenting this in the sandbox UI
- [ ] Correct amount sign logic: negative for debits, positive for credits (GH #10)
- [ ] CSV format selector on the upload step is presented but DBS is the only supported format — wire it up when a second parser lands
- [ ] No CI workflow runs lint/typecheck/tests on pull requests

