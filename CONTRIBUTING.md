# Contributing to LunchPrep

Thank you for your interest in contributing! LunchPrep is an open-source tool that helps Singapore bank users convert their CSV exports into Lunch Money import files. All contributions — bug fixes, new bank parsers, documentation improvements, and UI enhancements — are welcome.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Running Tests](#running-tests)
4. [Code Style](#code-style)
5. [Adding a New Bank Parser](#adding-a-new-bank-parser)
6. [Opening Issues](#opening-issues)
7. [Pull Request Process](#pull-request-process)

---

## Prerequisites

- **Node.js 20+** (LTS recommended) — [nodejs.org](https://nodejs.org)
- **npm** (bundled with Node.js)
- A **Google Gemini API key** if you want to test AI categorisation locally — [aistudio.google.com](https://aistudio.google.com/)
- **Docker** (optional, for testing the containerised build)

---

## Local Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/lunchprep.git
cd lunchprep

# 2. Install dependencies
npm install

# 3. Copy the environment variable template
cp .env.example .env.local

# 4. Add your Gemini API key to .env.local
#    (open .env.local in your editor and fill in GEMINI_API_KEY)

# 5. Start the development server
npm run dev
# → http://localhost:3000
```

> **BYOK mode:** If you don't want to configure a server-side API key, you can enter your Gemini API key directly in the app's settings panel. In this mode, AI calls go from your browser straight to Google — the server-side key is not used.

---

## Running Tests

LunchPrep uses [Vitest](https://vitest.dev/) for unit testing.

```bash
# Run all tests once
npm test -- --run

# Run a single test file
npx vitest run tests/parsers/dbs.test.ts

# Run tests in watch mode during development
npm test
```

**Test structure:** test files live under `tests/` and mirror the `src/` directory:

```
tests/
├── anonymiser/pii.test.ts
├── categoriser/prompt.test.ts
├── components/
│   ├── file-upload.test.ts
│   └── transaction-table.test.ts
├── exporter/lunchmoney.test.ts
├── hooks/use-local-storage.test.ts
└── parsers/dbs.test.ts
```

Each new feature must include at minimum:

- 1 test for expected use (happy path)
- 1 edge case test
- 1 failure/error case test

---

## Code Style

LunchPrep is written in **TypeScript (strict mode)**. Please follow these conventions:

| Rule | Detail |
|---|---|
| **TypeScript** | Strict mode; no `any` types — use proper interfaces |
| **Exports** | Named exports only (`export function Foo`); default export only for `src/app/page.tsx` |
| **Components** | `"use client"` directive at the top of all React components |
| **Styling** | Tailwind CSS utility classes only — no inline styles or CSS modules |
| **File length** | Maximum 500 lines per file; split into modules if approaching the limit |
| **Comments** | JSDoc for every exported function; inline `// Reason:` comments for non-obvious logic |
| **Imports** | Use the `@/` path alias for all `src/` imports |

Run the linter before opening a PR:

```bash
npm run lint
npx tsc --noEmit
```

---

## Adding a New Bank Parser

LunchPrep is designed to be extensible. Adding support for a new Singapore bank (OCBC, UOB, etc.) requires three steps:

### 1. Implement the `BankParser` interface

Create a new file at `src/lib/parsers/<bank>.ts`:

```typescript
// src/lib/parsers/ocbc.ts
import type { BankParser, RawTransaction } from "./types";

export const ocbcParser: BankParser = {
  bankName: "OCBC",

  /**
   * Detect whether the CSV content is from OCBC by matching its header row.
   */
  detect(csvContent: string): boolean {
    return csvContent.includes("Transaction Date") && csvContent.includes("OCBC");
  },

  /**
   * Parse raw OCBC CSV text into RawTransaction[].
   */
  parse(csvContent: string): RawTransaction[] {
    // ... your parsing logic ...
    return [];
  },
};
```

### 2. Register the parser

Add your parser to `src/lib/parsers/registry.ts`:

```typescript
import { ocbcParser } from "./ocbc";

const PARSERS: BankParser[] = [
  dbsParser,
  ocbcParser, // ← add here
];
```

### 3. Add tests

Create `tests/parsers/ocbc.test.ts` covering:

- Each transaction type/code your parser handles
- Edge cases (missing fields, unusual formatting)
- The `detect()` method (true positive and false negative)

Refer to `tests/parsers/dbs.test.ts` for the established test pattern.

---

## Opening Issues

Before opening an issue, please search existing issues to avoid duplicates.

**Bug reports** should include:
- A description of the unexpected behaviour
- Steps to reproduce (if applicable, attach an anonymised CSV sample)
- Expected vs actual output
- Browser and OS version

**Feature requests** should include:
- A clear description of the problem this solves
- Any relevant examples or mockups

---

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feature/add-ocbc-parser
   ```

2. **Make your changes** following the code style guidelines above.

3. **Add/update tests** — PRs without tests for new functionality will not be merged.

4. **Run the full validation suite**:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test -- --run
   npm run build
   ```

5. **Open a pull request** against the `main` branch. Include:
   - A clear title (e.g. `feat: add OCBC bank parser`)
   - A description of what changed and why
   - Screenshots or test output if relevant

6. A maintainer will review your PR. Please respond to feedback and update your branch as needed.

---

## Questions?

Open a [GitHub Discussion](https://github.com/batikfatigue/lunchprep/discussions) or file an issue with the `question` label.
