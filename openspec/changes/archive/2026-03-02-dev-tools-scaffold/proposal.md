## Why

During development we need internal utility tools — pipeline inspectors, UI annotators, state injectors, data exporters — that coexist with the running app. Today there is no infrastructure for this: any dev-only code would either leak into the production bundle or require ad-hoc solutions per tool. We need a reusable scaffold that makes dev tools **physically impossible** to access or download in production, while being trivial to add and remove during development.

## What Changes

- **New `src/dev-tools/` directory** with a defined boundary, bootstrap mount, tool registry, and shell UI (floating panel + standalone page modes).
- **Build-time exclusion pipeline**: environment variable guard (`NEXT_PUBLIC_DEV_TOOLS`), Webpack `IgnorePlugin` in `next.config.ts`, `.dockerignore` and `.vercelignore` entries — ensuring multi-layer defense against dev code leaking into production.
- **ESLint enforcement**: `no-restricted-imports` rule preventing production code (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`) from importing anything under `@/dev-tools/*`.
- **Tool registration contract**: a simple `DevTool` interface and manual registry array for adding tools with zero ceremony.

## Capabilities

### New Capabilities
- `dev-tools-scaffold`: Build-time isolation infrastructure, directory convention, env guards, Webpack/deploy exclusion, ESLint enforcement, and the bootstrap mount in the root layout.
- `dev-tools-shell`: The container UI that hosts registered tools — a floating panel overlay for inline tools and a standalone page mode for full-screen tools, plus the tool registry and `DevTool` interface contract.

### Modified Capabilities

*(none — no existing specs are affected)*

## Impact

- **`next.config.ts`**: Webpack plugin addition for production builds.
- **`src/app/layout.tsx`**: Conditional `DevToolsBootstrap` mount (compile-time eliminated in production).
- **`eslint.config.mjs`**: New `no-restricted-imports` rule.
- **`.dockerignore`** and new **`.vercelignore`**: Exclude `src/dev-tools/`.
- **New `.env.development`**: Sets `NEXT_PUBLIC_DEV_TOOLS=true`.
- **No changes** to any existing production code in `src/lib/`, `src/components/`, or `src/app/api/`.
- **No new npm dependencies** — uses React, existing Tailwind/shadcn, and built-in Webpack plugins only.
