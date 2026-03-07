# Dev-Tools Guideline

This document outlines the architecture, principles, and procedures for implementing internal-only development tools in LunchPrep. Our primary goal is **absolute production exclusion**—ensuring that dev-tool code and expensive debugging data never leak into the production environment.

---

## 🏗 The Three Layers of Isolation

LunchPrep uses a multi-layered defense to isolate dev tools at physical, build-time, and logical levels.

### 1. The Isolation Layer (`src/dev-tools/`)
All dev-only code, components, and logic MUST reside entirely within the `src/dev-tools/` directory. 
- **Rule**: No file inside `src/dev-tools/` should ever be imported into a production file via a static `import` statement.
- **Rule**: Reusable utilities required by both production and dev-tools should live in `src/lib/`, but they should never reference anything in `src/dev-tools/`.

### 2. The Inclusion Layer (`NEXT_PUBLIC_DEV_TOOLS`)
Dev tools are integrated into the application using a **build-time gate**. We use the `NEXT_PUBLIC_DEV_TOOLS` environment variable combined with `next/dynamic`.

- **Bootstrap**: In `src/app/layout.tsx`, we load the dev-tool shell using a ternary that Next.js evaluates during the build:
  ```tsx
  const DevToolsBootstrap = process.env.NEXT_PUBLIC_DEV_TOOLS === "true" 
    ? dynamic(() => import("@/dev-tools/_bootstrap")) 
    : null;
  ```
- **Dead Code Elimination**: When building for production (`NEXT_PUBLIC_DEV_TOOLS` is unset or false), the bundler (Turbopack/Webpack) treats the `false` branch as dead code and completely excludes the `import("@/dev-tools/...")` chunk from the final bundle graph.

### 3. The Reasoning Layer (Environment-Aware Logic)
Some dev-only features require special data from the backend (e.g., Gemini's reasoning/chain-of-thought).
- **Conditional API**: The `/api/categorise` route checks `process.env.NEXT_PUBLIC_DEV_TOOLS` on the server.
- **Cost/Latency Control**: If dev-tools are disabled, the server strictly omits the reasoning instructions from the Gemini prompt to avoid unnecessary costs and latency in production.

---

## 🛠 Adding a New Dev Tool

### Pattern A: Registry-based (Floating Shell)
Best for tools that should be accessible globally via the dev-tools floating panel (Ctrl+Shift+D).
1. Create your tool directory: `src/dev-tools/my-new-tool/`.
2. Implement your component and a `DevTool` descriptor in `index.tsx`.
3. Register it in `src/dev-tools/_registry.ts`.

### Pattern B: Contextual (Page-level)
Best for tools that must appear inline on a specific page (like the Categorisation Debugger).
1. Create your tool directory: `src/dev-tools/my-context-tool/`.
2. In the target page (e.g., `page.tsx`), use the gated `next/dynamic` pattern to import and render your tool.
   ```tsx
   const MyTool = process.env.NEXT_PUBLIC_DEV_TOOLS === "true" 
     ? dynamic(() => import("@/dev-tools/my-context-tool")) 
     : null;
   ```

---

## 🧹 Removing a Dev Tool
To remove a tool, simply delete its directory in `src/dev-tools/` and remove its registration or page-level import. Because of the isolation rules, you can be 100% certain no production code depends on it.

## ✅ Verification

Always run `npm run build` after major dev-tool changes. If the production build fails with an import error referencing `src/dev-tools/`, it means you've broken the isolation layer and created a static reference that must be gated.

**Mandatory Verification Rule**: For every task that is involved with internal tooling or dev tooling, always verify at the end of the implementation that the change is isolated from the production code.
