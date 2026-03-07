name: "Phase 4: Deployment & Open Source Release — Dockerfile, Landing Hero, README, LICENSE, CONTRIBUTING"
description: |

## Purpose
Full implementation plan for Phase 4 of LunchPrep. Provides complete context, verified
patterns from the official Next.js Docker example, and executable validation gates so
the agent can build and validate in one pass without gaps.

## Core Principles
1. **Context is King**: All interfaces, data shapes, existing code, and edge cases are documented here.
2. **Validation Loops**: Every gate is a runnable command; run and fix before moving on.
3. **Progressive Success**: Configure, build, containerise, then document.
4. **Global rules**: Follow all rules in CLAUDE.md (strict TypeScript, JSDoc, 500-line limit, named exports, tests).

---

## Goal

Prepare LunchPrep for deployment and open-source release. The five deliverables are:

1. **`next.config.ts`** — Add `output: 'standalone'` to enable Next.js standalone production builds.
2. **`Dockerfile`** — 3-stage multi-stage build (`deps → builder → runner`) using `node:20-alpine`.
   Optimised for Google Cloud Run and any Docker-compatible host.
3. **`.dockerignore`** — Prevent `.env.local`, dev secrets, and large cache directories from
   being baked into the image.
4. **`src/components/landing-hero.tsx`** — New "Privacy First" hero section displayed above the
   upload UI, explaining the tool's purpose and how to use it.
5. **Update `src/app/page.tsx`** — Mount LandingHero in the upload step above the existing grid.
6. **`LICENSE`** — MIT license (2026, author: batikfatigue).
7. **`CONTRIBUTING.md`** — Standard open-source contributing guidelines.
8. **`README.md`** — Full rewrite: badges, overview, env vars table, local dev, Docker run,
   GCP Cloud Run deployment steps, and self-hosting instructions.
9. **`docs/todo.md`** — Mark all Phase 4 items as `[x]`.

## Why
- The app is complete (Phases 1–3 done); it needs to be deployable and shareable.
- Standalone output + multi-stage Docker = minimal image (~150 MB vs ~1 GB naive).
- The landing hero addresses user onboarding — new users need to understand "Privacy First"
  before uploading their bank statement.
- Open-source boilerplate (LICENSE, CONTRIBUTING) is required for the public GitHub release.

## What

### User-Visible Behaviour
1. Visiting the app shows a privacy-focused hero section **above** the upload card.
2. The hero explains: what LunchPrep does, privacy guarantees, and 3-step usage instructions.
3. Docker users can self-host with a single `docker run` command.
4. Vercel users can deploy by setting `GEMINI_API_KEY` in the Vercel dashboard.

### Success Criteria
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] `npm run build` succeeds and produces `.next/standalone/`
- [ ] `Dockerfile` builds successfully with `docker build`
- [ ] `docker run` starts the app on port 3000
- [ ] `.dockerignore` excludes `.env.local`, `.git`, `node_modules`, `.next`, `.claude`
- [ ] `src/components/landing-hero.tsx` renders above the upload grid in the upload step
- [ ] `LandingHero` uses named export, `"use client"` directive, shadcn/ui Card, Tailwind only
- [ ] `LICENSE` is MIT, year 2026
- [ ] `CONTRIBUTING.md` is clear and actionable
- [ ] `README.md` badge updated from "Restricted" to "MIT", includes Docker and Cloud Run steps
- [ ] `docs/todo.md` Phase 4 items marked `[x]`
- [ ] All existing tests still pass: `npm test -- --run`
- [ ] `npm run build` passes with zero errors
- [ ] No file exceeds 500 lines

---

## All Needed Context

### Documentation & References

```yaml
# MUST READ before implementing
- file: CLAUDE.md
  why: Global rules — strict TS, JSDoc, 500-line limit, named exports, "use client" requirement

- file: docs/architecture.md
  why: Data flow, directory structure, env var table (GEMINI_API_KEY, GEMINI_MODEL, RATE_LIMIT_RPM)

- file: docs/todo.md
  why: Phase 4 checklist items to mark [x] when done

- file: next.config.ts
  why: MODIFY — add output: 'standalone'. Currently empty config object.

- file: src/app/page.tsx
  why: MODIFY — add <LandingHero /> above the upload step grid. Keep all existing logic intact.

- file: src/app/layout.tsx
  why: READ ONLY — understand existing root layout structure (Inter font, metadata)

- file: src/components/file-upload.tsx
  why: Pattern reference for component structure — "use client", named export, JSDoc, shadcn Card, Tailwind

- file: src/components/pipeline-steps.tsx
  why: Pattern reference for simple presentational components using cn(), Tailwind classes

- file: src/components/ui/card.tsx
  why: shadcn Card component API — CardHeader, CardTitle, CardContent, CardDescription

- file: .gitignore
  why: Base for .dockerignore — already excludes node_modules, .next, .env.local, .env.
       The .dockerignore should extend this with Docker-specific exclusions.

- file: .env.example
  why: Documents the 3 env vars: GEMINI_API_KEY, GEMINI_MODEL, RATE_LIMIT_RPM

- file: src/app/api/categorise/route.ts
  why: Confirms GEMINI_API_KEY is READ at runtime via process.env (not at build time).
       This means GEMINI_API_KEY must NOT be set during docker build — pass it at runtime.

- file: README.md
  why: REWRITE — current version is a stub with restrictive license. Replace entirely.

- file: package.json
  why: Verify scripts (dev, build, start, lint, test) — Docker runner uses `node server.js` (standalone)

- url: https://github.com/vercel/next.js/tree/canary/examples/with-docker
  why: Official Next.js Docker example — Dockerfile structure, stage names, COPY patterns

- url: https://nextjs.org/docs/app/guides/self-hosting
  why: Environment variable handling (build-time vs runtime), standalone output config

- url: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service
  why: Cloud Run deployment steps for README self-hosting section

- url: https://opensource.guide/
  why: CONTRIBUTING.md structure and best practices
```

### Current Codebase Tree

```
/
├── .env.example                  # GEMINI_API_KEY, GEMINI_MODEL, RATE_LIMIT_RPM
├── .gitignore                    # Excludes .env*.local, node_modules, .next, .claude
├── next.config.ts                # MODIFY: add output: 'standalone'
├── package.json                  # scripts: dev, build, start, test, lint
├── README.md                     # REWRITE: stub with restricted license
├── src/
│   ├── app/
│   │   ├── api/categorise/route.ts  # Reads GEMINI_API_KEY at runtime (process.env)
│   │   ├── layout.tsx               # Root layout (no changes)
│   │   └── page.tsx                 # MODIFY: add <LandingHero /> above upload step
│   ├── components/
│   │   ├── file-upload.tsx          # Pattern reference
│   │   ├── pipeline-steps.tsx       # Pattern reference
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx             # Use for LandingHero
│   │       └── input.tsx
│   └── lib/...                      # No changes
└── tests/...                         # No changes
```

### Desired Codebase Tree (new/modified files marked)

```
/
├── .dockerignore                 # NEW — Docker build exclusions
├── Dockerfile                    # NEW — 3-stage multi-stage build
├── CONTRIBUTING.md               # NEW — open-source contributing guide
├── LICENSE                       # NEW — MIT 2026
├── next.config.ts                # MODIFIED — add output: 'standalone'
├── README.md                     # REWRITE — full self-hosting guide
├── src/
│   ├── app/
│   │   └── page.tsx              # MODIFIED — add <LandingHero /> above upload step
│   └── components/
│       └── landing-hero.tsx      # NEW — privacy-first hero section
└── docs/
    └── todo.md                   # MODIFIED — Phase 4 items marked [x]
```

### Known Gotchas & Critical Notes

```typescript
// CRITICAL: next.config.ts uses TypeScript. The output option syntax is:
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: 'standalone',
};
export default nextConfig;
// NOT module.exports = { output: 'standalone' } (that's for .js config)

// CRITICAL: Standalone output creates .next/standalone/ which contains:
//   - server.js (the Node.js server entry point)
//   - node_modules/ (only production deps needed, tree-shaken)
// The Dockerfile runner stage must ALSO copy:
//   - /app/public (public assets — not in standalone)
//   - /app/.next/static → /app/.next/static (static chunks — not in standalone)
// COPY pattern from builder:
//   COPY --from=builder /app/public ./public
//   COPY --from=builder /app/.next/standalone ./
//   COPY --from=builder /app/.next/static ./.next/static

// CRITICAL: GEMINI_API_KEY is a RUNTIME-ONLY env var. The route.ts reads
// process.env.GEMINI_API_KEY at request time, not at build time.
// DO NOT set GEMINI_API_KEY as ARG or ENV in the Dockerfile builder stage.
// Pass it at runtime: docker run -e GEMINI_API_KEY=...
// OR configure it in Cloud Run's environment variables section.

// CRITICAL: The Docker runner must set:
//   ENV HOSTNAME="0.0.0.0"    # Required for Cloud Run (listens on all interfaces)
//   ENV PORT=3000              # Exposed port
//   ENV NODE_ENV=production
// Without HOSTNAME=0.0.0.0, Cloud Run health checks will fail.

// CRITICAL: Use node:20-alpine (NOT node:20-slim or node:24-slim).
// The INITIAL.md spec explicitly requires node:20-alpine.

// CRITICAL: Run container as non-root user for security:
//   USER nextjs
// Create the user in the runner stage:
//   RUN addgroup --system --gid 1001 nodejs && \
//       adduser --system --uid 1001 nextjs
// Use --chown=nextjs:nodejs on all COPY commands in runner stage.

// GOTCHA: next build will fail if GEMINI_API_KEY is not set at build time
// ONLY if there is a getStaticProps or similar that calls the API at build.
// This app has NO static generation — the API route is dynamic.
// Therefore NO GEMINI_API_KEY is needed at build time. Verified by reading
// route.ts: it only runs on POST requests, not at build time.

// GOTCHA: The .dockerignore must exclude .next/ so the builder stage starts
// from a clean state. Otherwise, local dev artifacts contaminate the build.

// GOTCHA: The LandingHero component goes ABOVE the upload step grid, NOT
// inside a card or replacing any existing UI. In page.tsx, the upload step
// renders a grid with upload zone + settings sidebar. The hero should be
// rendered before this grid, still inside the `step === "upload"` block.

// GOTCHA: "use client" is required on LandingHero because it's imported by
// the page.tsx client component. Even if LandingHero itself has no hooks,
// it must be a client component to avoid hydration issues.
// (Technically it can be a Server Component if standalone, but for simplicity
// and consistency with the codebase pattern, use "use client".)

// CRITICAL: named exports only for components (CLAUDE.md rule).
// LandingHero must use: export function LandingHero() { ... }
// NOT: export default function LandingHero() { ... }
```

---

## Implementation Blueprint

### Task List (ordered)

```yaml
Task 1: Update next.config.ts — add standalone output
  MODIFY next.config.ts:
    - ADD: output: 'standalone' to the nextConfig object
    - PRESERVE: TypeScript syntax (import type { NextConfig } from "next")
  WHY FIRST: Required for Dockerfile to work. Run `npm run build` to verify.
  VALIDATION: After build, check that .next/standalone/ directory exists.

Task 2: Create .dockerignore
  CREATE .dockerignore at project root
  CONTENT: Cover all categories — build artifacts, secrets, dev config, OS files, git.
  CRITICAL EXCLUSIONS:
    - .env*.local (NEVER bake API keys into image)
    - .env
    - .git/
    - node_modules/
    - .next/
    - .claude/
    - .agents/
    - PRPs/
    - tests/
    - pull_requests/
    - docs/
    - specs/
    - *.md (except README.md — exclude it with INCLUDE pattern doesn't work, just leave *.md out)
    - sample_input.csv
    - .DS_Store
    - Thumbs.db
    - coverage/
    - tsconfig.tsbuildinfo
  NOTE: .dockerignore does NOT support negations well with *.md — instead just keep it simple.

Task 3: Create Dockerfile — 3-stage multi-stage build
  CREATE Dockerfile at project root
  STAGES:
    - Stage 1 (deps): Install ALL dependencies (including devDeps for build)
    - Stage 2 (builder): Build the Next.js app
    - Stage 3 (runner): Minimal runtime image with standalone output only
  BASE IMAGE: node:20-alpine (as specified in INITIAL.md)
  CMD: ["node", "server.js"] (Next.js standalone entry point)

Task 4: Create src/components/landing-hero.tsx
  CREATE src/components/landing-hero.tsx
  DESIGN:
    - "use client" directive at top
    - Named export: export function LandingHero()
    - Uses shadcn/ui Card, CardContent, Tailwind CSS only
    - No inline styles, no CSS modules
    - JSDoc for the exported function
  CONTENT SECTIONS:
    1. Hero: App name + tagline (converts DBS CSVs → Lunch Money)
    2. Privacy First badge/callout (prominent, uses green or shield icon)
    3. How it works: 3 steps (Upload → Review → Export) as flex/grid cards
    4. BYOK note: mention users can bring their own Gemini API key

Task 5: Update src/app/page.tsx — mount LandingHero
  MODIFY src/app/page.tsx:
    - ADD import for LandingHero at top with other component imports
    - ADD <LandingHero /> ABOVE the existing grid in the `step === "upload"` block
    - PRESERVE: all existing logic, handlers, state, and other UI unchanged
    - LandingHero goes BEFORE the `<div className="grid gap-6 lg:grid-cols-3">` element

Task 6: Create LICENSE
  CREATE LICENSE (no extension) at project root
  TYPE: MIT License
  YEAR: 2026
  AUTHOR: batikfatigue

Task 7: Create CONTRIBUTING.md
  CREATE CONTRIBUTING.md at project root
  SECTIONS:
    - Prerequisites (Node.js 20+, npm)
    - Local development setup (clone, npm install, .env.local, npm run dev)
    - Running tests (npm test)
    - Pull request process
    - Adding a new bank parser (BankParser interface, registry.ts)
    - Code style (TypeScript strict, ESLint, Tailwind only)
    - Opening issues (bug vs feature)

Task 8: Rewrite README.md
  REWRITE README.md completely
  SECTIONS:
    1. Header: Logo/title, badges (MIT, WIP→stable, Lunch Money, Gemini)
    2. Overview: What it does, privacy model
    3. Screenshots/Demo (placeholder note)
    4. Prerequisites: Node.js 20+, Gemini API key
    5. Environment Variables table (Required/Optional, build/runtime)
    6. Local Development: clone, install, .env.local, npm run dev
    7. Running Tests: npm test
    8. Docker (self-hosting):
       - Build: docker build -t lunchprep .
       - Run: docker run -p 3000:3000 -e GEMINI_API_KEY=your-key lunchprep
    9. Google Cloud Run deployment steps
    10. Vercel deployment steps
    11. Adding Banks (link to CONTRIBUTING.md)
    12. License section (MIT)

Task 9: Update docs/todo.md
  MODIFY docs/todo.md:
    - Mark all Phase 4 items as [x]:
      - [x] Configure Vercel deployment; set environment variables in dashboard
      - [x] Write `Dockerfile` using `node:20-alpine`...
      - [x] Write landing page section explaining the tool...
      - [x] Add `README.md` with self-hosting instructions...
      - [x] Open-source repository setup: `LICENSE` (MIT), `CONTRIBUTING.md`

Task 10: Final validation
  Run all validation gates (see Validation Loop section below).
```

### Per-Task Pseudocode

#### Task 1: next.config.ts

```typescript
// CURRENT:
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* config options here */
};
export default nextConfig;

// TARGET:
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: 'standalone',
};
export default nextConfig;
```

#### Task 2: .dockerignore

```
# .dockerignore
# Development and local config
.env
.env.local
.env.*.local

# Source control
.git
.gitignore

# Dependencies (rebuilt in Docker)
node_modules

# Build artifacts (rebuilt in Docker)
.next
out
dist
build

# Dev tooling
.claude
.agents
.DS_Store
Thumbs.db

# Project files not needed in image
PRPs
tests
pull_requests
docs
specs
sample_input.csv
*.tsbuildinfo
CONTRIBUTING.md
INITIAL.md
HANDOFF.md

# Logs
*.log
npm-debug.log*

# Coverage
coverage
```

#### Task 3: Dockerfile

```dockerfile
# Stage 1: Install ALL dependencies (dev + prod, needed for build step)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Reason: NEXT_TELEMETRY_DISABLED prevents telemetry calls during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# CRITICAL: HOSTNAME must be 0.0.0.0 for Cloud Run (listens on all interfaces)
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed for the standalone runtime
# public/ — static assets served directly (not included in standalone/)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# standalone/ — the self-contained Node.js server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# static/ — JS chunks, CSS; must be at .next/static within the runner workdir
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js is the standalone entry point generated by Next.js
CMD ["node", "server.js"]
```

#### Task 4: landing-hero.tsx

```typescript
// src/components/landing-hero.tsx
"use client";

/**
 * LandingHero — Privacy-first hero section displayed above the upload UI.
 *
 * Explains the tool's purpose, privacy model, and 3-step usage instructions.
 * Rendered on the Upload step before users interact with the file input.
 */

import { Shield, Upload, Sparkles, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// PATTERN: named export (not default) per CLAUDE.md coding standards
export function LandingHero() {
  return (
    <div className="mb-8 space-y-6">
      {/* Hero heading */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          DBS → Lunch Money, in under 2 minutes.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your DBS bank CSV. LunchPrep uses Gemini AI to categorise
          your transactions and exports a clean file ready to import into{" "}
          <a href="https://lunchmoney.app" target="_blank" rel="noopener noreferrer"
             className="underline underline-offset-4 hover:text-foreground">
            Lunch Money
          </a>.
        </p>
      </div>

      {/* Privacy First callout */}
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
        <Shield className="size-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-green-800 dark:text-green-300">Privacy First</p>
          <p className="text-sm text-green-700 dark:text-green-400">
            Your bank data is parsed entirely in your browser and never stored on any server.
            Before any AI call, names and account numbers are replaced with realistic placeholders.
            Your original data is restored locally before export.
          </p>
        </div>
      </div>

      {/* 3-step how it works */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Step 1 */}
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Upload className="size-5 text-primary" />
            </div>
            <p className="font-semibold">1. Upload</p>
            <p className="text-sm text-muted-foreground">
              Export your DBS statement as a CSV and drop it here.
            </p>
          </CardContent>
        </Card>
        {/* Step 2 */}
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="font-semibold">2. Review</p>
            <p className="text-sm text-muted-foreground">
              Gemini AI categorises every transaction. Edit payees, notes,
              or categories inline before exporting.
            </p>
          </CardContent>
        </Card>
        {/* Step 3 */}
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Download className="size-5 text-primary" />
            </div>
            <p className="font-semibold">3. Export</p>
            <p className="text-sm text-muted-foreground">
              Download a Lunch Money-compatible CSV and import it directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Task 5: page.tsx update

```typescript
// ADD this import at the top of src/app/page.tsx with the other component imports:
import { LandingHero } from "@/components/landing-hero";

// LOCATE this block in the render section (around line 223):
{step === "upload" && (
  <div className="grid gap-6 lg:grid-cols-3">
    {/* ... existing upload grid ... */}
  </div>
)}

// MODIFY to:
{step === "upload" && (
  <>
    <LandingHero />
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ... existing upload grid (unchanged) ... */}
    </div>
  </>
)}

// GOTCHA: Wrap in a React Fragment <> so we can have two sibling elements
// inside the conditional render block without a wrapper div.
```

#### Task 6: LICENSE

```
MIT License

Copyright (c) 2026 batikfatigue

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### Task 8: README.md key sections

```markdown
# README.md structure (write the full content)

## Header
- Title: LunchPrep
- Badges: MIT, for: Lunch Money, AI: Google Gemini, TypeScript
- Tagline: "Convert DBS bank CSVs into Lunch Money imports — with AI categorisation."

## Overview
- Privacy-first: processed in browser, PII anonymised before AI
- Supports DBS CSV format (more banks planned)

## Environment Variables
| Variable        | Required             | Default                 | Description                    |
|----------------|----------------------|-------------------------|--------------------------------|
| GEMINI_API_KEY | Yes (hosted mode)    | —                       | Server-side Gemini API key     |
| GEMINI_MODEL   | No                   | gemini-2.5-flash-lite   | Gemini model to use            |
| RATE_LIMIT_RPM | No                   | 10                      | Requests per minute per IP     |

## Local Development
npm install → copy .env.example → npm run dev

## Docker (Self-Hosting)
docker build -t lunchprep .
docker run -p 3000:3000 -e GEMINI_API_KEY=your-key lunchprep

## Vercel
1. Fork repository
2. Import in Vercel dashboard
3. Set GEMINI_API_KEY env var
4. Deploy

## Google Cloud Run
(gcloud steps: artifact registry, docker push, gcloud run deploy --set-env-vars)

## BYOK Mode
Users can provide their own Gemini API key via the in-app settings.
When BYOK key is set, AI calls go directly from browser to Gemini.
The server-side GEMINI_API_KEY is not required in this mode.
```

### Integration Points

```yaml
NEXT_CONFIG:
  - file: next.config.ts
  - ADD: output: 'standalone'
  - VERIFY: npm run build creates .next/standalone/server.js

DOCKER_BUILD:
  - command: docker build -t lunchprep .
  - expected: Successfully built <sha>

DOCKER_RUN:
  - command: docker run -p 3000:3000 -e GEMINI_API_KEY=test lunchprep
  - expected: Server listening on 0.0.0.0:3000

PAGE_INTEGRATION:
  - add import in src/app/page.tsx
  - wrap upload-step JSX in React Fragment with LandingHero above grid
  - NO changes to handler functions or state

TYPESCRIPT:
  - LandingHero: no props interface needed (no props)
  - All imports verified to exist: Shield, Upload, Sparkles, Download from lucide-react
  - Card, CardContent from @/components/ui/card (already installed)
```

---

## Validation Loop

### Level 1: TypeScript Build

```bash
# After Task 1 (next.config.ts update), verify build succeeds:
npm run build

# Expected: ✓ Compiled successfully
# Expected: .next/standalone/ directory exists
ls .next/standalone/server.js

# After Task 5 (page.tsx update), verify no type errors:
npx tsc --noEmit
```

### Level 2: Docker Build

```bash
# After Task 3 (Dockerfile) and Task 2 (.dockerignore), build the image:
docker build -t lunchprep .

# Expected: Successfully tagged lunchprep:latest
# If error: READ the error message carefully. Common issues:
#   - "standalone not found" → next.config.ts missing output: 'standalone'
#   - "COPY failed" → check paths in Dockerfile match actual .next output

# Verify image size is reasonable (should be ~150-300MB, NOT ~1GB):
docker images lunchprep
```

### Level 3: Docker Run

```bash
# Test the container runs correctly:
docker run -p 3000:3000 -e GEMINI_API_KEY=placeholder lunchprep

# In another terminal:
curl http://localhost:3000
# Expected: HTML response with LunchPrep page content (not an error)

# Stop the container after verifying
```

### Level 4: Lint

```bash
npm run lint
# Expected: No warnings or errors
```

### Level 5: Unit Tests

```bash
# Run all tests — none should be broken by these changes:
npm test -- --run

# Expected: All tests pass
# If failures: investigate why existing tests broke — likely an import or
# module resolution issue from the next.config.ts change.
```

### Level 6: Visual Verification

```bash
# Start dev server and visually verify the landing hero renders:
npm run dev
# Open http://localhost:3000
# Expected:
#   - LandingHero appears above the upload card
#   - Privacy First banner is visible with green styling
#   - Three step cards (Upload, Review, Export) are displayed
#   - Clicking "Browse files" or drag-drop still works after hero is added
```

## Final Validation Checklist

- [ ] `npm run build` succeeds with zero errors
- [ ] `.next/standalone/server.js` exists after build
- [ ] `docker build -t lunchprep .` succeeds
- [ ] `docker run -p 3000:3000 -e GEMINI_API_KEY=placeholder lunchprep` starts and serves HTML
- [ ] `npm test -- --run` — all existing tests pass
- [ ] `npm run lint` — zero errors
- [ ] `.dockerignore` excludes `.env.local`, `.env`, `.git`, `node_modules`, `.next`
- [ ] `src/components/landing-hero.tsx` uses named export, "use client", JSDoc
- [ ] `LandingHero` renders in the upload step (above the grid)
- [ ] `LICENSE` is MIT, year 2026
- [ ] `CONTRIBUTING.md` covers prerequisites, setup, testing, PR process
- [ ] `README.md` badge updated to MIT, Docker + Cloud Run steps present
- [ ] `docs/todo.md` Phase 4 items all marked `[x]`
- [ ] No file exceeds 500 lines
- [ ] No TypeScript `any` types in new code

---

## Anti-Patterns to Avoid

- ❌ Do NOT set `GEMINI_API_KEY` as a Docker build ARG — it's runtime-only
- ❌ Do NOT use `node:20-slim` or `node:24` — spec requires `node:20-alpine`
- ❌ Do NOT forget `libc6-compat` on alpine (required for some npm packages)
- ❌ Do NOT copy node_modules into the runner stage — standalone bundles only needed deps
- ❌ Do NOT forget `HOSTNAME="0.0.0.0"` — Cloud Run health checks will fail without it
- ❌ Do NOT use default export for LandingHero — named export only (CLAUDE.md rule)
- ❌ Do NOT add inline styles to LandingHero — Tailwind classes only
- ❌ Do NOT use `any` types in TypeScript
- ❌ Do NOT modify the upload step handler logic — only add the hero component above the grid
- ❌ Do NOT skip the Fragment wrapper `<>` when adding LandingHero — JSX requires single root

---

## PRP Confidence Score: 9/10

**Rationale:**
- All env vars, file paths, and API patterns verified from source code
- Official Next.js Docker example pattern captured verbatim
- Existing component patterns clearly documented for LandingHero consistency
- Build-time vs runtime env var distinction confirmed by reading route.ts
- The only uncertainty is whether `libc6-compat` is strictly required on node:20-alpine
  for this specific project's dependencies — but it's standard practice and safe to include.
- Docker testing (Level 2-3) requires Docker to be installed on the system; if not available,
  the agent should note this and skip to Level 4-5 validation.
