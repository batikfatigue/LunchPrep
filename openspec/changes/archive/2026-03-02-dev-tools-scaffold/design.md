## Context

LunchPrep is a Next.js 16 + TypeScript app that deploys via both Docker (Cloud Run) and Vercel. The production build uses `output: "standalone"` for Docker and standard Vercel builds. There is currently no infrastructure for internal development tools.

The app has a clean module structure: `src/app/` (routes), `src/components/` (UI), `src/lib/` (business logic), `src/hooks/` (React hooks). All production code lives within these four directories.

## Goals / Non-Goals

**Goals:**
- Dev tool code is **physically absent** from production builds — not hidden, not gated, but eliminated at compile time and excluded from deploy artifacts.
- Adding a new dev tool requires only: creating a directory, writing a component, and adding one line to a registry array.
- Removing a dev tool requires only: deleting its directory and removing the registry line.
- Support two display modes: **floating panel** (overlay on existing pages) and **standalone page** (full-screen dev tool).
- Work correctly for both Docker and Vercel deployment targets.
- Zero impact on production bundle size, runtime performance, and user experience.

**Non-Goals:**
- Building any specific dev tool (pipeline inspector, annotator, etc.) — those are separate changes.
- Dynamic tool discovery or plugin architecture — manual registry is sufficient.
- Dev tool persistence or settings — individual tools handle their own state.
- Server-side dev-only API routes — can be added later when a tool needs them.
- Hot-reloading of tool registration — standard Next.js HMR is sufficient.

## Decisions

### 1. Use `NEXT_PUBLIC_DEV_TOOLS` environment variable as the primary gate

**Decision:** A single `NEXT_PUBLIC_DEV_TOOLS` env var (set in `.env.development`, absent in production) controls whether dev-tools code enters the bundle.

**Why:** Next.js replaces `process.env.NEXT_PUBLIC_*` with literal string values at compile time. When the variable is absent, the condition `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'` becomes `undefined === 'true'` → `false`, and Webpack/Turbopack eliminates the entire dead code branch — including any `import()` expressions inside it. This means dev-tools modules are never even added to the module graph.

**Alternatives considered:**
- `NODE_ENV` checks: Already used for dev/prod, but `NODE_ENV` is not available on the client side in Next.js and can't gate client components.
- Custom Webpack `DefinePlugin` flags: More powerful but harder to understand and maintain. `NEXT_PUBLIC_*` achieves the same with zero config.

### 2. Webpack `IgnorePlugin` as a production build failsafe

**Decision:** In `next.config.ts`, add a Webpack `IgnorePlugin` that rejects any import resolving to `src/dev-tools/` when `NODE_ENV === 'production'`.

**Why:** The env guard (Decision 1) is the primary mechanism, but it's a convention — someone could forget the guard. The IgnorePlugin is a hard failsafe: if any import path touches `dev-tools/` during a production build, the build errors out. This makes accidental leakage a build failure, not a silent deployment.

**Alternatives considered:**
- `NormalModuleReplacementPlugin` (replace with empty stub): Gentler (build succeeds) but defeats the "physically impossible" requirement. A silent stub could mask bugs.
- Turbopack equivalent: Turbopack doesn't support `IgnorePlugin` yet. The `next.config.ts` Webpack customisation only applies when using the Webpack bundler. For Turbopack, the env guard and `.dockerignore`/`.vercelignore` layers provide the guarantee. We use `webpack` key which is only used when Webpack is the bundler, so this is compatible.

### 3. Physical file exclusion via `.dockerignore` and `.vercelignore`

**Decision:** Add `src/dev-tools/` to both `.dockerignore` and a new `.vercelignore` file.

**Why:** Belt-and-suspenders. Even if Decisions 1 and 2 both somehow fail, the source files literally don't exist in the build context. Docker's `COPY . .` during the builder stage won't include them; Vercel's deployment won't upload them. This is the final physical guarantee.

### 4. Single bootstrap component in root layout

**Decision:** `src/app/layout.tsx` conditionally renders a `<DevToolsBootstrap />` component, wrapped in the env guard. The bootstrap is a thin wrapper that dynamically imports the dev-tools shell.

**Why:** The root layout is the single integration point between production and dev-tools code. By keeping this to one conditional render with a dynamic import, the entire dev-tools tree is gated by a single guard. The dynamic import ensures the shell code is in a separate chunk that Webpack can independently eliminate.

**The layout change is minimal:**
```tsx
{process.env.NEXT_PUBLIC_DEV_TOOLS === 'true' && <DevToolsBootstrap />}
```

The `DevToolsBootstrap` component itself lives in `src/dev-tools/` and uses `next/dynamic` to lazy-load the shell — keeping the root layout's static import list clean of any dev-tools references.

### 5. Manual registry array for tool registration

**Decision:** Tools are registered in a `_registry.ts` file as a typed array of `DevTool` objects. Adding a tool = adding one entry to the array.

**Why:** A manual array is the simplest possible registration mechanism. It's immediately understandable, fully type-safe, greppable, and doesn't require filesystem scanning, decorators, or conventions beyond "add a line."

**Interface:**
```typescript
interface DevTool {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  mode: 'panel' | 'standalone' | 'both';
  component: React.ComponentType;
}
```

### 6. Two display modes: floating panel and standalone page

**Decision:** The shell supports two modes — a floating panel overlay (for tools that augment existing pages) and a standalone full-screen mode (for tools that need their own page). Each tool declares its supported mode(s) via the `mode` field in its registry entry.

**Why:** Different tools have fundamentally different spatial needs. An inline annotator needs to overlay the production UI. A data exporter might need full-screen table space. Supporting both from day one avoids redesigning the shell later.

**Floating panel:** Renders as a draggable, collapsible panel anchored to a screen edge. Contains a tool selector and renders the selected tool's component inside it.

**Standalone page:** Uses a dedicated dev-only route (e.g., `src/dev-tools/_pages/`) rendered within the shell. Accessible via a link in the floating panel toolbar. These routes are also protected by the env guard and Webpack plugin — they cannot exist in production.

### 7. ESLint `no-restricted-imports` for boundary enforcement

**Decision:** Add a `no-restricted-imports` rule that prevents files in `src/app/`, `src/components/`, `src/lib/`, and `src/hooks/` from importing anything matching `@/dev-tools/*`.

**Why:** This catches boundary violations at dev time in the editor, before they ever reach a build. The rule applies only to production code directories; files within `src/dev-tools/` can freely import from production code (one-way dependency flow).

**Exception:** `src/app/layout.tsx` needs a narrow override to allow the `DevToolsBootstrap` import. This is configured via an ESLint override targeting that single file.

## Risks / Trade-offs

**[Risk] Turbopack doesn't support Webpack IgnorePlugin** → The env guard (Decision 1) and deploy-time exclusion (Decision 3) still provide the guarantee. When Turbopack adds plugin support, we can add the equivalent. In the meantime, two of three exclusion layers still function.

**[Risk] Developer forgets the env guard when referencing dev-tools in layout** → The Webpack IgnorePlugin and ESLint rule both catch this. Build fails and editor shows the error immediately.

**[Risk] Floating panel obscures production UI during development** → Panel should be collapsible to a minimal toolbar and draggable/repositionable. A keyboard shortcut toggle mitigates this further.

**[Trade-off] Dev-tools code is not in a separate package** → Keeping tools in `src/dev-tools/` (same repo, same build) is simpler than a monorepo package. The trade-off is that the exclusion relies on build-time mechanisms rather than package boundaries. The multi-layer defense makes this acceptable.
