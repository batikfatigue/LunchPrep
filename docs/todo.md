# Roadmap

## Completed

- [x] Product-identity revision "Prep Bench" (developer workbench): original supplied icon restored in header/footer wordmark (invented PrepMark removed), terminal/editor panes with gutter and status bar, mono accent phrase, pipeline status strip with real busy state, smooth-scroll `#import` anchor with header offset, destination focus, no-JS fallback and reduced-motion opt-out; DESIGN.md updated; tests for wordmark, pipeline busy state, `ScrollLink` and the scroll CSS contract.
- [x] Fix motion + logo regressions: `ScrollLink` now runs a controlled rAF scroll (~1s ease-in-out, header offset, repeat-click restart, cancel on user input, reduced-motion/modified click fall back to native, hash + focus on arrival) because CSS smooth read as a jump; wordmark no longer forces a `#f4f2ee` tile in dark mode (transparent `icon.png` shown bare); tests for sequencing, interruption, reduced motion, keyboard; DESIGN.md updated.
- [x] Product-identity revision "Prep Sheet": replaced lifestyle photos with product-led visuals (prep sheet, CSV preview, marker accent, new wordmark/mark), removed photo credits and the "Powered by Lunch Money" badge, added independence note, updated DESIGN.md.
- [x] Complete web redesign "Shophouse Row" (Quiet Editorial, replaces lunchbox): warm paper tokens, photo-led landing, ledger-style review table with mobile row layout, export handoff, settings/dialog restyle, DESIGN.md.

- [x] Complete design revamp ("lunchbox" language): new tokens (`--ink-line`, `--cta`, hard shadows), Bricolage Grotesque + Geist type, top-bar shell replacing the sidebar, two-column landing with the lunchbox artwork, restyled upload/review/export, shared `Notice`, new tests for `Notice`, `PipelineSteps` and `AppShell`.
- [x] Supplied LunchPrep artwork used for the workspace identity, multi-size favicon, and Apple touch icon.
- [x] Lunch Money-inspired brand system and responsive workspace; guided import/review/export with manual mode, safe sample statements, bulk category assignment, and confirmed resets.
- [x] Pipeline sandbox — mock transaction input form in the pipeline inspector for testing edge cases (dev-tools-pipeline-sandbox)
- [x] Consolidate categorisation debugger into pipeline inspector (reasoning, payload, annotations → API Result Panel)
- [x] UI/UX redesign — app shell with numbered step pills + settings dialog, upload hero with flow diagram/format select/privacy + AI mode cards, review table with filter chips/search/selection/sorting/pagination, export summary screen
- [x] OpenAI-compatible API provider support — `AI_PROVIDER`/`OPENAI_*` env vars for the server proxy and a provider picker (key + base URL + model) for BYOK
- [x] OpenAI-compatible hardening — tolerant JSON parsing (fences/prose/content parts), `/chat/completions` URL normalisation, HTTP 400 retry without `response_format`, real provider error surfaced in the review banner, proxy/BYOK radio actually controls routing
- [x] BYOK relay fallback — when an OpenAI-compatible endpoint can't be reached from the browser (no CORS headers), the call is relayed through `/api/categorise` via a `byok` body field that overrides server env config

## Discovered During Work

- [x] Redesign QA: the persistent dev server on :3417 served stale CSS after globals.css was rewritten (Turbopack cache). Verified instead against a production build (`npm run start --port 3561`, dev tools off) — desktop 1440 / mobile 390 smoke passed. Remaining dev-only note: `NEXT_PUBLIC_DEV_TOOLS=true` in `.env.development` shows dev-tools buttons that overlap bottom corners at 390px (dev only).
- [ ] Review table rows use `role="row"/"cell"` with CSS grid below `md`; verify with a screen reader.
- [x] Found CC BY-SA photographs removed with the Prep Sheet revision.
- [ ] Open-link `#import` focus on direct page load/back-forward (hash) is native scroll only; focus is moved on click.
- [ ] `public/powered-by-lunch-money.png` is now unused (badge implies an API connection LunchPrep lacks); delete or keep only if a real integration lands.
- [ ] Confirm brand/trademark guidance from the Lunch Money media kit (lunchmoney.app/media-kit, blocked to automated fetch) before using any Lunch Money asset.

- [ ] Fix the existing `tests/categoriser/client.test.ts` relay fixture type (`date` is a string, not `Date`); it blocks TypeScript validation on `main`.
- [ ] `anonymise()` on single-transaction arrays may produce different results than batch — consider documenting this in the sandbox UI
- [ ] Correct amount sign logic: negative for debits, positive for credits (GH #10)
- [ ] CSV format selector on the upload step is presented but DBS is the only supported format — wire it up when a second parser lands
- [ ] No CI workflow runs lint/typecheck/tests on pull requests
