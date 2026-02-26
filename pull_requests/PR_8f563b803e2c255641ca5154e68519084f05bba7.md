## Description
Initial project scaffolding for LunchPrep. This PR establishes the foundation of the application by initializing a Next.js 16 project using the App Router and TypeScript, alongside core tooling for styling, testing, and documentation. 

## Changes
- **Framework:** Initialized Next.js 16 app router with TypeScript (`src/app/page.tsx`, `layout.tsx`)
- **Styling:** Configured PostCSS, Tailwind CSS (`src/app/globals.css`), and initialized the `shadcn/ui` component registry (`components.json`, `Button` component, base utilities)
- **Testing:** Set up Vitest testing environment with `happy-dom` (`vitest.config.mts`, `tests/setup.test.ts`)
- **Code Quality:** Configured ESLint (`eslint.config.mjs`) and TypeScript (`tsconfig.json`)
- **Documentation:** Added core project planning documentation (`INITIAL.md`, `CLAUDE.md`), updated `docs/todo.md`, and added PR preparation templates (`PRPs/`)
- **Environment:** Added `.env.example` and standard `.gitignore`

## Related Issue
*(Please replace with linked issue # if applicable)*

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [x] Refactor / Chore (Scaffolding & Configuration)
- [x] Documentation

## Testing
- Verified Next.js framework configuration (`next.config.ts`, `package.json` setup)
- Vitest test environment correctly configured and base test resolving to true 

## Screenshots (if UI changes)
*(Not applicable for core scaffolding)*
