# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LunchPrep — Convert Singapore bank CSVs into Lunch Money imports with Gemini AI categorisation.

## Commands

```bash
npm run dev              # Dev server
npm run build            # Production build
npm test                 # All tests
npx vitest run <path>    # Single test file
```

## Architecture

Read [docs/architecture.md](docs/architecture.md) for system design, data flow, interfaces, and directory structure.

## Requirements

Read [docs/prd.md](docs/prd.md) for product scope and MVP definition.

## Specs

Detailed implementation specs live in `specs/`:
- [specs/bank-parsing.md](specs/bank-parsing.md) — DBS parser rules and transformations
- [specs/ai-categorisation.md](specs/ai-categorisation.md) — Anonymisation, Gemini config, API contract
- [specs/export.md](specs/export.md) — Lunch Money CSV format

## Roadmap

See [docs/todo.md](docs/todo.md) for the phased development checklist.

## Stack

Next.js 15, TypeScript (strict), shadcn/ui, Tailwind CSS 4, PapaParse, Gemini 2.5 Flash-Lite, Vitest.
