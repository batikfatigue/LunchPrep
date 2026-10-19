# DESIGN.md — LunchPrep

System: **Quiet Editorial** base (warm neutrals, hairlines, scale contrast, generous
spacing) with two deliberate, project-specific overrides recorded below:
the marker accent, and the **developer-workbench** identity.
Direction name: **Prep Bench**. Replaces "Prep Sheet" after the owner said LunchPrep
is a developer tool and invited a terminal / code-editor style. Root project
direction takes precedence over the generic lifestyle/editorial defaults.

## Logo (constraint, not optional)
The supplied artwork is the primary brand: yellow lunchbox, paper and teal check
badge in `src/app/icon.png` (served at `/icon.png`; also `apple-icon.png`,
`favicon.ico`, added in f7748bf). It was briefly replaced without authorisation
by an invented "PrepMark"; the original artwork is now restored. Rules:
- Header and footer lockup = `<Image src="/icon.png">` (40px header, 56px footer, unaltered)
  plus lowercase `lunchprep` as before, now in JetBrains Mono semibold.
- Never redraw, recolour, crop or replace it; do not edit the asset files.
- Dark and light: `icon.png` is 512px RGBA with a fully transparent background, so it is
  shown bare on the page ground in both themes. No tile, paper plate or background
  class behind it (the earlier `dark:bg-[#f4f2ee]` tile was rejected by the owner).
  Its yellow body and teal badge carry it on #212121; verified at 1440/390.
  `apple-icon.png` is opaque by design (home-screen icon) and is not used in the UI.
- Palette cues come from it: yellow = marker, teal = `--ok` (status "done", output dot).

## Workbench override: why and what
Why: users are developers/power users moving a CSV through import -> transform/review
-> export. A CSV workbench is the honest metaphor; terminal/editor cues (mono, gutters,
panes, status bars) describe real things the product has: files, rows, columns, status.
What:
- Panes (`.pane`, `.pane-bar`, `.pane-status`, `.gutter` in globals.css): filename tab,
  hairline frame, line numbers, status bar. Used by the hero source -> output view
  and the export CSV preview. Only fictional sample data, always labelled as sample.
- Purposeful mono: labels, figures, filenames, the pipeline strip, the one emphasised
  headline phrase (`em` in `.display`/`.statement`: mono + marker underline; replaces
  the Instrument Serif italic, font removed).
- Status: pipeline strip = mono stations on a hairline; current = marker, done = teal
  check + word, busy = pulsing dot + sr "in progress" (only while parsing/categorising).
- Display type shrunk to `clamp(2.5rem, 7vw, 6.25rem)` so mono phrases fit at 390px.
- Not done, on purpose: fake shell prompts or commands, decorative code, faux window
  chrome buttons, a looping caret (the one bounded caret is in "Import section colour"). Contrast, tap targets and 16px body stay.
- Quiet Editorial rules still in force: no gradients/shadows at rest, hairlines,
  warm paper tokens, no rainbow tags. "Index numbers" stay dropped except the
  real line-number gutter in sample panes.

## Idea
LunchPrep is the preparation step between a Singapore bank CSV and Lunch Money.
Its identity is the preparation itself: a raw bank line on one side, a clean
row on the other, and a highlighter pass over whatever LunchPrep rewrote.
Nothing is decoration; every visual is a real fragment of the product
(fictional data only) or the CSV format it writes. The review table stays a
ledger.

## Relationship to Lunch Money
Evidence (accessed 2026-10-19; lunchmoney.app itself returns a Cloudflare 403 to
non-browser fetches, so it was not scraped):
- developers.lunchmoney.app "Branding your app" (via alpha.lunchmoney.dev/branding-your-app):
  name is "Lunch Money"; the logo, name and smiling-coin mascot are trademarks of
  Lunchbag Labs, Inc.; do not alter the mascot or recolour/stretch the logo; do not
  imply endorsement, partnership or official status; keep your own product name primary.
- The "Powered by Lunch Money" badge previously in `public/` shows a gold smiling
  coin and a serif wordmark. That badge credits an API connection LunchPrep does not have.
Decisions:
- Do not use the coin, the logo or the badge (no integration exists, so it would
  imply one). Say "Lunch Money" in plain text only.
- Tie visually through warmth only: the gold marker, which also comes from our
  own logo's yellow. Identity stays LunchPrep-first.
- Re-checked 2026-10-19 (alpha.lunchmoney.dev/branding-your-app): colours are not
  specified there; they point to the media kit, which stays unverified (blocked).
- Footer states it is independent and not affiliated or endorsed; the only
  relationship claimed is CSV compatibility.

## Core rules in force
- Scale contrast: oversized regular-weight display (Inter Tight 400, tracking
  -0.045em, leading ~1), everything else small. Never bold display type.
- Warm neutral ground, no gradients, no shadows at rest. Accent: see Marker below.
- Product-led (override of photo-led, see Imagery) and asymmetric where text is concerned: prose spans at most 8/12 columns.
- 1px hairlines under the header, between sections and above meta rows.
- Mono micro labels (JetBrains Mono, 11px, +0.08em, uppercase).
- Arrow glyph in primary calls to action.
- Generous spacing: section padding clamp(72px, 10vw, 144px).

## Options chosen
| Option | Choice |
|---|---|
| C serif display | **Dropped** (workbench): mono replaces the serif accent |
| D accent word | Yes, one per headline, mono + marker underline |
| F pill CTA | Yes, pills for buttons and chips; inputs are underlined fields |
| O dark variant | Yes, neutral charcoal (#212121 ground) |
| Q stats row | Yes, numerals with micro captions on review and export |
| (workbench) | Mono for code-like moments; no serif |
| K single accent | **Overridden: yes**, the marker as the identity. Rationale: the product's job is to mark what it prepared; the highlighter is the identity. Later extended for the Import section only, see "Import section colour". |

## Dropped, do not add
Two-tone headlines, any second accent, round cards, index numbers (01/02), framed
canvases, crosshair marks, word-as-image heroes, rainbow category tags.

## Tokens (see `src/app/globals.css`)
| Token | Light | Dark |
|---|---|---|
| paper (background) | #F4F2EE | #212121 |
| paper-raised (card) | #FFFFFF | #2A2A2A |
| paper-sunken (muted) | #EAE8E3 | #171717 |
| ink (foreground / primary) | #171614 | #F2F0EB |
| ink-soft (muted-foreground) | #4A4845 | #C8C5BF |
| ink-mute (labels, large type only) | #6B6863 | #99968F |
| line (border) | #DCD9D3 | #3C3C3C |
| input line | #B4B0A8 | #5A5A5A |
| destructive | #A3321F | #F08A78 |
| marker (accent) | #F6D54A | #F0CF45 |
| marker-ink | #171614 | #171614 |

Type: Inter Tight (UI + display), JetBrains Mono (labels, figures, filenames, accent phrase).
Extra tokens: `--ok` teal (#2C6F63 / #6FC4B2, from the logo's check badge; status only), `--header-h` (6.75rem below md, 4.25rem md+).
Scale: display `clamp(2.5rem, 7vw, 6.25rem)`, statement `clamp(2rem, 4vw, 3.5rem)`, body 1rem, meta 0.875rem, label 0.6875rem.

## Marker
`.marker` = gold highlighter pass, always ink text on it (contrast >10:1), 2px radius.
Uses: the "Prep" in the wordmark, what LunchPrep rewrote in the prep sheet and
CSV preview, the current pipeline step, text selection. Never for buttons, fills
or large areas.

## Import section colour (owner request: it felt colourless)
Rule change, scoped to `#import` (upload-step.tsx, file-upload.tsx): the logo's two colours
now carry a hierarchy there, instead of neutral-only / marker-never-a-fill.
- Yellow (marker) = the thing to read or press: the full highlighter pass on the heading
  phrase (`.statement em.em-fill`, ink on gold), the section label on arrival (`:target`),
  and the **Continue to review** pill, gold only while enabled (file chosen, not loading,
  key present). Disabled stays the neutral ink pill, so gold means "ready".
- Teal (`--ok`) = the input side and its state: section label, DBS chip and "Supported",
  drop-zone dashed border (hover solid + faint tint, drag-over stronger tint), upload/file
  icon, Browse pill, selected-file frame, spinner while preparing, checked radio.
- Everything else stays neutral. No third colour, no gradients, no shadows. Elsewhere the
  old rules still hold (marker is not a button fill outside this section).
- Text-caret motif: kept to one bounded use. A 2px teal bar after "Drop your statement
  here" appears only while the drop zone has keyboard focus or a file is dragged over it,
  blinks three times and rests solid (`.caret`, `caret-blink`, `iteration-count: 3`).
  Reason: it marks where input will land, which is the preparation idea; a looping caret,
  a caret in headings or fake typing would be decoration, so none. Reduced motion: the
  global rule collapses the blink to a static bar. The real pointer is untouched.
- Contrast: teal on paper 5.3:1 light, 7.8:1 dark; ink on gold 12.5:1.

## Imagery
Override of Quiet Editorial's photo-led rule: no stock or lifestyle photography.
Visuals are built in HTML/CSS from the product itself, in `src/components/brand/`:
- `prep-sheet.tsx`: hero. Two-pane workbench, source lines beside prepared rows, gutter, status bar.
- `csv-preview.tsx`: export. A pane with the five CSV columns and two fictional rows.
- `wordmark.tsx`: the original supplied icon + `lunchprep` text (see Logo).
- Landing steps carry small live fragments (file chip, category chip, CSV header).
Data is fictional (from specs/output.md). Alt/aria text describes what is shown.
The former kaya-toast and shophouse photos and their credits were removed.

## Components
- Buttons: primary = ink fill pill + trailing arrow, secondary = 1px outline pill, tertiary = underlined link.
- Forms: mono label above field; fields are underline-only (48px) or hairline pills for search.
- Category tags: neutral hairline pills, icon + word. Status uses glyph + word, never colour alone.
- Review table: hairline ledger, no outer card; on phones each row becomes a stacked entry.

## Motion (all CSS unless noted; transform/opacity/background only)
- In-page anchors: "Import a statement" (`ScrollLink`, `src/components/scroll-link.tsx`)
  is a real `<a href="#import">`. Without JS, or with a modified click, a missing target
  or `prefers-reduced-motion: reduce`, the browser jumps natively (instantly) and `:target`
  marks the "Import a statement" label; focus follows on the next task.
- Otherwise the click is intercepted and scrolled by a controlled rAF animation: ease-in-out
  cubic, 600-1100ms scaled by distance (about 1s for the hero to import). Destination is
  measured live every frame: `window.scrollY + section.getBoundingClientRect().top -
  header.getBoundingClientRect().bottom`, so the section's top border settles exactly on
  the sticky header's bottom edge (measured 0.3-0.5px, i.e. sub-pixel scroll rounding, at
  1440 and 390). No `--header-h` guess, no scroll-margin and no extra padding in this path.
  Frames use `behavior: "instant"` so CSS smooth cannot stack. Repeat clicks restart from the
  current position (within 0.5px: focus only); wheel, touch, mouse-down, keys or a
  scrollbar drag cancel it in place. On arrival: final position, `location.hash` (history +
  `:target`), a 0.5px re-check against the browser's fragment scroll, heading focus with
  `preventScroll`, only after the animation.
- `ScrollLink` also mirrors the real header height into `--header-h` (ResizeObserver +
  resize) and `scroll-padding-top` is exactly `var(--header-h)` (no extra rem), so native
  jumps (reduced motion, URL hashes) also land flush. CSS fallbacks 6.75rem / 4.25rem only
  apply before hydration. `scroll-behavior: smooth` stays for no-preference; reduced motion
  forces `auto`.
- Step changes jump to top instantly (`behavior: "instant"`); content swap, not navigation.
- `.rise` 450ms, stagger 70ms. `.marker-wipe` 600ms once per load on the hero's rewritten
  fields. Hero rows lift on hover (200ms). CTA arrow nudges on hover, 0.98 press scale.
- Busy dot pulses only while `isParsing` or categorising is true. No looping decoration.

## Dev tools
Unchanged and not exposed in production (`NEXT_PUBLIC_DEV_TOOLS`).
