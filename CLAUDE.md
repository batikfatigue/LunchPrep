# CLAUDE.md

This file provides guidance to AI coding assistants when working with code in this repository.

## 🔄 Project Awareness & Context

LunchPrep — Convert Singapore bank CSVs into Lunch Money imports with Gemini AI categorisation.

- **Always read `docs/prd.md` and `docs/architecture.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `docs/todo.md` (Roadmap)** before starting a new task. If the task isn't listed, add it.
- Detailed implementation specs live in `specs/`:
  - [specs/bank-parsing.md](specs/bank-parsing.md) — DBS parser rules and transformations
  - [specs/ai-categorisation.md](specs/ai-categorisation.md) — Anonymisation, Gemini config, API contract
  - [specs/output.md](specs/output.md) — Lunch Money CSV format requirements
- Reference Data: [docs/dbs_formats.md](docs/dbs_formats.md) — Raw DBS CSV field formats per transaction code.

## 💻 Tech Stack & Commands

Next.js 16, TypeScript (strict), shadcn/ui, Tailwind CSS 4, PapaParse, Gemini 2.5 Flash-Lite, Vitest.

```bash
npm run dev              # Dev server
npm run build            # Production build
npm test                 # All tests
npx vitest run <path>    # Single test file
```

## 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility (e.g., `parsers`, `exporter`, `categoriser`).
- **Use clear, consistent imports** (prefer the `@/` alias for root imports within the `src/` directory).

## 🧪 Testing & Reliability

- **Always create Vitest unit tests for new features** (functions, parsers, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should mirror the main app structure**. Include at least:
  - 1 test for expected use
  - 1 edge case
  - 1 failure case

## ✅ Task Completion

- **Mark completed tasks in `docs/todo.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `docs/todo.md` under a "Discovered During Work" section.

## 📎 Style & Conventions

- **Use TypeScript** as the primary language with strict type checking.
- **Follow modern React conventions**, use strict ESLint rules, and style with Tailwind CSS.
- Write **JSDoc/TSDoc comments for every significant function**:
  ```typescript
  /**
   * Brief summary.
   *
   * @param {Type} param1 - Description.
   * @returns {Type} Description.
   */
  ```

## 📚 Documentation & Explainability

- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `// Reason:` comment** explaining the why, not just the what.

## 🧠 AI Behavior Rules

- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified npm/Node.js packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `docs/todo.md`.
