## 1. Build-Time Exclusion Infrastructure

- [ ] 1.1 Create `.env.development` with `NEXT_PUBLIC_DEV_TOOLS=true`
- [ ] 1.2 Add Webpack `IgnorePlugin` to `next.config.ts` that rejects imports from `src/dev-tools/` when `NODE_ENV === 'production'`
- [ ] 1.3 Add `src/dev-tools/` to `.dockerignore`
- [ ] 1.4 Create `.vercelignore` with `src/dev-tools/` entry

## 2. ESLint Boundary Enforcement

- [ ] 2.1 Add `no-restricted-imports` rule to `eslint.config.mjs` preventing `@/dev-tools/*` imports from production directories
- [ ] 2.2 Add ESLint override for `src/app/layout.tsx` allowing the `DevToolsBootstrap` import

## 3. Dev-Tools Directory and Registry

- [ ] 3.1 Create `src/dev-tools/` directory with the `DevTool` interface type definition
- [ ] 3.2 Create `src/dev-tools/_registry.ts` with an empty `DEV_TOOLS` typed array
- [ ] 3.3 Create `src/dev-tools/_bootstrap.tsx` that dynamically imports and renders the shell

## 4. Shell UI — Floating Panel

- [ ] 4.1 Create the floating panel component with collapsible/expandable behaviour
- [ ] 4.2 Add tool selector that lists registered panel-mode tools and renders the selected tool's component
- [ ] 4.3 Add persistent visual dev-mode indicator (visible when panel is collapsed)

## 5. Shell UI — Standalone Page Mode

- [ ] 5.1 Create the standalone full-screen view component for tools with `mode: 'standalone'` or `'both'`
- [ ] 5.2 Add navigation links in the floating panel toolbar for standalone tools
- [ ] 5.3 Add back/close navigation to return from standalone view to normal app

## 6. Root Layout Integration

- [ ] 6.1 Add conditional `DevToolsBootstrap` render to `src/app/layout.tsx` guarded by `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'`

## 7. Verification

- [ ] 7.1 Verify `next dev` shows the floating panel shell with empty tool list
- [ ] 7.2 Verify `next build` succeeds with zero dev-tools code in production output
- [ ] 7.3 Verify ESLint reports an error when production code imports from `@/dev-tools/*`
