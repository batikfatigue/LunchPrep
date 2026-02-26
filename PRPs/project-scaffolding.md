name: "Project Scaffolding — Next.js 16 + Tailwind CSS 4 + shadcn/ui + Vitest"
description: |

## Purpose
Initialise the LunchPrep Next.js 16 project in an existing repo that already contains documentation, specs, and data files. The scaffolding must preserve all existing files while adding the full development stack.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Set up a fully working Next.js 16 development environment with TypeScript (strict), App Router, Tailwind CSS 4, shadcn/ui, and Vitest — all inside the existing LunchPrep repository without overwriting any existing files (docs, specs, data files, README, CLAUDE.md, .gitignore).

## Why
- **Foundation**: Every subsequent feature (parsers, AI categorisation, UI) depends on this scaffolding being correct
- **Consistency**: Lock in the exact stack versions and conventions from the architecture doc before any feature code is written
- **Developer Experience**: Path aliases (`@/`), testing, linting, and hot reload must all work from day one

## What
After this PRP is executed:
- `npm run dev` starts the Next.js dev server with a placeholder page
- `npm run build` succeeds with zero errors
- `npm test` runs Vitest (with `@/` path alias support)
- shadcn/ui components can be added via `npx shadcn@latest add <component>`
- All existing files (`docs/`, `specs/`, `src/lib/parsers/data/`, `sample_input.csv`, `CLAUDE.md`, `README.md`) are untouched

### Success Criteria
- [ ] `npm run dev` starts successfully on localhost:3000
- [ ] `npm run build` completes with zero errors
- [ ] `npm test` runs Vitest and exits cleanly (no tests yet, but config works)
- [ ] `@/` path alias resolves in both app code and tests
- [ ] `npx shadcn@latest add button` installs a component into `src/components/ui/`
- [ ] `.env.local` template exists with `GEMINI_API_KEY`, `GEMINI_MODEL`, `RATE_LIMIT_RPM`
- [ ] Existing files in `docs/`, `specs/`, `src/lib/parsers/data/` are preserved
- [ ] `layout.tsx` uses Inter font, has LunchPrep metadata, and applies global styles
- [ ] `tests/` directory exists and is ready for Phase 1 test files
- [ ] `docs/todo.md` Phase 1 "Project Setup" items are checked off

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: CLAUDE.md
  why: Project coding standards, conventions, and rules that MUST be followed

- file: docs/architecture.md
  why: Directory structure, stack table, config variables, core interfaces

- file: docs/todo.md
  why: Phase 1 "Project Setup" checklist — mark items complete when done

- file: INITIAL.md
  why: The feature specification with examples for layout.tsx, .env.local, and target structure

- url: https://nextjs.org/docs/app/getting-started/installation
  why: create-next-app flags, generated file structure, App Router setup

- url: https://tailwindcss.com/docs/guides/nextjs
  why: Tailwind CSS 4 installation with Next.js — CSS-only config (no tailwind.config.ts)

- url: https://ui.shadcn.com/docs/installation/next
  why: shadcn/ui init process for Next.js with Tailwind v4

- url: https://ui.shadcn.com/docs/tailwind-v4
  why: Tailwind v4-specific shadcn setup — OKLCH colors, @custom-variant, tw-animate-css

- url: https://nextjs.org/docs/app/guides/testing/vitest
  why: Official Vitest setup for Next.js — required packages and vitest.config.mts
```

### Current Codebase tree
```
.
├── .claude/
│   └── rules/coding-standards.md
├── docs/
│   ├── architecture.md
│   ├── dbs_formats.md
│   ├── prd.md
│   └── todo.md
├── specs/
│   ├── ai-categorisation.md
│   ├── bank-parsing.md
│   └── output.md
├── src/
│   └── lib/
│       └── parsers/
│           └── data/
│               ├── dbs_codes.json        # ← PRESERVE: 928 DBS transaction codes
│               └── fast_purpose_codes.json # ← PRESERVE
├── PRPs/
├── .gitignore                            # ← PRESERVE + MERGE
├── CLAUDE.md                             # ← PRESERVE
├── INITIAL.md
├── README.md                             # ← PRESERVE
└── sample_input.csv                      # ← PRESERVE
```

### Desired Codebase tree with files to be added
```
.
├── docs/                                 # ← Existing, preserved
├── specs/                                # ← Existing, preserved
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Base shell: Inter font, metadata, global styles
│   │   ├── page.tsx                      # Placeholder homepage
│   │   ├── globals.css                   # Tailwind v4 directives + shadcn theme
│   │   └── favicon.ico                   # Default Next.js favicon
│   ├── components/
│   │   └── ui/                           # shadcn/ui components (empty, populated via CLI)
│   └── lib/
│       ├── utils.ts                      # shadcn cn() utility
│       └── parsers/
│           └── data/
│               ├── dbs_codes.json        # ← Existing, preserved
│               └── fast_purpose_codes.json # ← Existing, preserved
├── tests/                                # Empty directory, ready for test files
├── public/                               # Static assets (favicon, images)
├── .env.local                            # Template with placeholder keys
├── .gitignore                            # ← Merged: existing + Next.js entries
├── next.config.ts                        # Next.js configuration
├── tsconfig.json                         # TypeScript strict config with @/ alias
├── postcss.config.mjs                    # @tailwindcss/postcss plugin
├── eslint.config.mjs                     # ESLint flat config
├── vitest.config.mts                     # Vitest with path aliases
├── components.json                       # shadcn/ui CLI config
├── package.json                          # Scripts: dev, build, start, lint, test
├── CLAUDE.md                             # ← Existing, preserved
├── README.md                             # ← Existing, preserved
└── sample_input.csv                      # ← Existing, preserved
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Tailwind CSS v4 has NO tailwind.config.ts file.
// Config is done in CSS only. The PostCSS plugin is "@tailwindcss/postcss" (not "tailwindcss").
// CSS entry: `@import "tailwindcss";` (not `@tailwind base; @tailwind components; @tailwind utilities;`)

// CRITICAL: create-next-app --yes does NOT include --src-dir.
// You must pass --src-dir explicitly or answer the interactive prompt.

// CRITICAL: shadcn/ui components.json must have `tailwind.config: ""` (empty string) for TW v4.
// Colors use OKLCH format, not HSL.

// CRITICAL: Vitest needs `vite-tsconfig-paths` plugin to resolve the @/ alias.
// Without it, imports like `@/lib/utils` fail in tests.

// CRITICAL: The repo already has src/lib/parsers/data/. Scaffolding MUST NOT delete these.
// Strategy: scaffold in a temp directory, then move files into root.

// CRITICAL: .gitignore already exists with custom entries. MERGE, don't overwrite.
// Existing entries: .claude/, .agents/, .DS_Store, node_modules/, etc.

// CRITICAL: Vitest config file should be vitest.config.mts (not .ts) per Next.js docs.

// NOTE: shadcn/ui installs `tw-animate-css` (not `tailwindcss-animate`) for Tailwind v4.

// NOTE: Next.js 16 uses Turbopack by default for dev server.
```

## Implementation Blueprint

### List of tasks to be completed in order

```yaml
Task 1: Scaffold Next.js in temporary directory
  WHY: Cannot run create-next-app in root — it would overwrite existing files
  DO:
    - Run: npx create-next-app@latest tmp-scaffold --typescript --eslint --tailwind --src-dir --app --import-alias "@/*" --yes
    - This creates a complete Next.js 16 + Tailwind v4 project in tmp-scaffold/
  VERIFY: tmp-scaffold/ contains package.json, tsconfig.json, src/app/, etc.

Task 2: Move scaffolded files into project root (merge carefully)
  WHY: Integrate Next.js files without overwriting existing project files
  DO:
    - Copy these FROM tmp-scaffold/ TO project root:
      - package.json, package-lock.json (or use npm install later)
      - next.config.ts
      - tsconfig.json
      - postcss.config.mjs
      - eslint.config.mjs
    - Copy these FROM tmp-scaffold/src/app/ TO src/app/:
      - layout.tsx, page.tsx, globals.css, favicon.ico
    - Copy public/ directory
    - MERGE .gitignore: append Next.js entries to existing .gitignore
      Entries to add: /.next, /out, next-env.d.ts, *.tsbuildinfo, .vercel, .env*.local (but NOT .env.local itself since we want the template tracked)
    - DO NOT copy: tmp-scaffold/README.md, tmp-scaffold/.gitignore (merge instead)
    - Delete tmp-scaffold/ when done
  VERIFY: ls project root shows package.json, next.config.ts, tsconfig.json, etc.
  VERIFY: src/lib/parsers/data/dbs_codes.json still exists

Task 3: Install dependencies and verify base build
  DO:
    - Run: npm install (in project root)
    - Run: npm run build
  VERIFY: Build succeeds with zero errors
  IF ERRORS: Read error output, fix config, rebuild

Task 4: Install and configure Vitest
  WHY: Testing framework required by project spec
  DO:
    - Run: npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom
    - Create vitest.config.mts:
      ```typescript
      import { defineConfig } from 'vitest/config'
      import react from '@vitejs/plugin-react'
      import tsconfigPaths from 'vite-tsconfig-paths'

      export default defineConfig({
        plugins: [tsconfigPaths(), react()],
        test: {
          environment: 'jsdom',
        },
      })
      ```
    - Update package.json scripts: set "test" to "vitest"
  VERIFY: npx vitest run exits cleanly (no test files yet, should say "no test files found" or similar, but NOT crash)

Task 5: Initialise shadcn/ui
  WHY: UI component library required by project spec
  DO:
    - Run: npx shadcn@latest init
    - When prompted, select: style = "new-york", base color = "neutral"
    - If non-interactive, ensure components.json is created with correct config
    - This will:
      - Create/update src/app/globals.css with theme CSS variables
      - Create src/lib/utils.ts with cn() utility
      - Create components.json at project root
      - Create src/components/ui/ directory
  VERIFY: components.json exists and has tailwind.config: ""
  VERIFY: src/lib/utils.ts exists with cn() function
  VERIFY: npx shadcn@latest add button works (then you can remove the button if desired, or keep it as a test)

Task 6: Customise layout.tsx
  WHY: Must match project spec — Inter font, LunchPrep metadata, centered layout
  DO:
    - Update src/app/layout.tsx:
      - Import Inter from next/font/google (replace Geist fonts if scaffolded)
      - Set metadata: title "LunchPrep", description from PRD ("Convert Singapore bank CSVs into Lunch Money imports with Gemini AI categorisation")
      - Apply Inter font class to <body>
      - Add a minimal centered layout wrapper (e.g., <main className="min-h-screen flex items-center justify-center">)
      - Keep the globals.css import
  VERIFY: npm run dev shows the page with Inter font

Task 7: Create placeholder page.tsx
  WHY: Provide a visible confirmation that the app works
  DO:
    - Update src/app/page.tsx with a simple placeholder:
      - Show "LunchPrep" heading
      - Show "Coming soon" or similar subtitle
      - Use Tailwind utility classes for styling
      - Keep it minimal — no parser/UI logic
  VERIFY: npm run dev shows the placeholder page at localhost:3000

Task 8: Create .env.local template
  DO:
    - Create .env.local with:
      ```
      GEMINI_API_KEY=your-api-key-here
      GEMINI_MODEL=gemini-2.5-flash-lite
      RATE_LIMIT_RPM=10
      ```
    - Ensure .gitignore has .env*.local entry (should already from Next.js merge)
  NOTE: Also consider creating .env.example (tracked by git) with the same template

Task 9: Create tests/ directory
  DO:
    - Create tests/ directory at project root
    - Optionally add a placeholder test file to verify Vitest config:
      ```typescript
      // tests/setup.test.ts
      import { describe, it, expect } from 'vitest'

      describe('Project setup', () => {
        it('should have vitest configured correctly', () => {
          expect(true).toBe(true)
        })
      })
      ```
  VERIFY: npx vitest run passes with 1 test

Task 10: Final build verification
  DO:
    - Run: npm run build (must succeed)
    - Run: npm test (Vitest must pass)
    - Run: npm run lint (ESLint must pass)
    - Run: npm run dev (dev server must start)
  VERIFY: All four commands succeed

Task 11: Update docs/todo.md
  WHY: Project convention — mark completed tasks immediately
  DO:
    - Check off all Phase 1 "Project Setup" items in docs/todo.md:
      - [x] Initialise Next.js 16 project with TypeScript
      - [x] Install and configure Tailwind CSS 4
      - [x] Install and configure shadcn/ui
      - [x] Set up Vitest for unit testing
      - [x] Create .env.local template
      - [x] Configure base layout (layout.tsx) and shell structure
```

### Per task pseudocode

```typescript
// Task 6: layout.tsx structure
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LunchPrep',
  description: 'Convert Singapore bank CSVs into Lunch Money imports with Gemini AI categorisation.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen flex items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  )
}
```

```typescript
// Task 7: page.tsx placeholder
export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight">LunchPrep</h1>
      <p className="mt-2 text-muted-foreground">
        Convert bank CSVs into Lunch Money imports. Coming soon.
      </p>
    </div>
  )
}
```

```typescript
// Task 4: vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

### Integration Points
```yaml
GITIGNORE:
  - MERGE with existing .gitignore
  - ADD entries: /.next, /out, next-env.d.ts, *.tsbuildinfo, .vercel, .env*.local

PACKAGE_JSON:
  - scripts.test must be "vitest" (not "vitest run" — matches CLAUDE.md convention "npm test")
  - scripts.dev = "next dev"
  - scripts.build = "next build"
  - scripts.lint = "next lint"

TSCONFIG:
  - strict: true (required by CLAUDE.md)
  - paths: { "@/*": ["./src/*"] }

ENV:
  - .env.local template with GEMINI_API_KEY, GEMINI_MODEL, RATE_LIMIT_RPM
  - .env.example (git-tracked copy for reference)
```

## Validation Loop

### Level 1: Build & Lint
```bash
# Run these FIRST — fix any errors before proceeding
npm run build          # Next.js production build
npm run lint           # ESLint

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Vitest
```bash
# Run Vitest — should find and pass the setup test
npx vitest run

# Expected: 1 test passed (tests/setup.test.ts)
# If "no tests found": check vitest.config.mts include patterns
# If import errors: check vite-tsconfig-paths is installed and configured
```

### Level 3: shadcn/ui Integration
```bash
# Test that shadcn CLI works
npx shadcn@latest add button

# Expected: Creates src/components/ui/button.tsx
# If errors: check components.json config, especially tailwind.config field
```

### Level 4: Dev Server
```bash
# Start dev server and verify page loads
npm run dev

# Expected: Server starts on http://localhost:3000
# Page shows "LunchPrep" heading with Inter font
# No console errors in browser
```

### Level 5: File Preservation Check
```bash
# Verify existing files were NOT deleted or modified
cat docs/architecture.md | head -1    # Should show "# Architecture & Technical Design"
cat specs/bank-parsing.md | head -1   # Should show "# Spec: Bank CSV Parsing"
ls src/lib/parsers/data/dbs_codes.json  # Should exist
cat CLAUDE.md | head -1               # Should show "# CLAUDE.md"
cat README.md | head -3               # Should show existing README content
cat sample_input.csv | head -1        # Should exist
```

## Final Validation Checklist
- [ ] `npm run dev` starts successfully
- [ ] `npm run build` completes with zero errors
- [ ] `npm run lint` passes
- [ ] `npx vitest run` passes (1 setup test)
- [ ] `@/` alias works in both app code and tests
- [ ] `npx shadcn@latest add button` succeeds
- [ ] `.env.local` template has all 3 variables
- [ ] `layout.tsx` uses Inter font and LunchPrep metadata
- [ ] `page.tsx` shows placeholder content
- [ ] `docs/`, `specs/`, `src/lib/parsers/data/` are preserved
- [ ] `.gitignore` contains both original and Next.js entries
- [ ] `docs/todo.md` Phase 1 "Project Setup" items are checked off
- [ ] No `tailwind.config.ts` file exists (Tailwind v4 uses CSS-only config)

---

## Anti-Patterns to Avoid
- ❌ Don't run `create-next-app` directly in the project root — it will overwrite files
- ❌ Don't create a `tailwind.config.ts` — Tailwind v4 is CSS-only
- ❌ Don't use `tailwindcss` as the PostCSS plugin — use `@tailwindcss/postcss`
- ❌ Don't use `@tailwind base; @tailwind components; @tailwind utilities;` — use `@import "tailwindcss";`
- ❌ Don't overwrite `.gitignore` — merge new entries with existing ones
- ❌ Don't delete `src/lib/parsers/data/` during scaffolding
- ❌ Don't install `tailwindcss-animate` — shadcn v4 uses `tw-animate-css`
- ❌ Don't use `vitest.config.ts` — use `vitest.config.mts` per Next.js docs
- ❌ Don't set package.json test script to `vitest run` — use `vitest` (watch mode by default, matches project convention)

## Confidence Score: 9/10

High confidence because:
- The feature is pure scaffolding with no business logic
- All tools (`create-next-app`, `shadcn init`, Vitest) have well-documented CLI workflows
- File preservation strategy (temp directory + move) is straightforward
- Every step has a concrete verification command
- External research confirmed exact commands, package names, and config formats for current versions

Minor uncertainty:
- `shadcn init` interactive prompts may vary slightly by version — the agent may need to adapt
- Exact `globals.css` content after shadcn init depends on the CLI version at execution time
