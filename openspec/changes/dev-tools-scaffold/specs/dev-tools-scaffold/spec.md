## ADDED Requirements

### Requirement: Dev-tools directory boundary
All development-only tool code SHALL reside under `src/dev-tools/`. Production code directories (`src/app/`, `src/components/`, `src/lib/`, `src/hooks/`) SHALL NOT contain dev-tool code.

#### Scenario: Dev-tools directory exists in development
- **WHEN** the project is set up for development
- **THEN** a `src/dev-tools/` directory exists containing the bootstrap, registry, and shell modules

#### Scenario: Clear separation from production code
- **WHEN** a developer creates a new dev tool
- **THEN** all tool code is placed under `src/dev-tools/` and not in any production directory

### Requirement: Environment variable gate
The system SHALL use the `NEXT_PUBLIC_DEV_TOOLS` environment variable to control whether dev-tools code enters the bundle. The variable MUST be set to `'true'` in `.env.development` and MUST be absent (or any value other than `'true'`) in production environments.

#### Scenario: Dev tools active in development
- **WHEN** `next dev` is run (which auto-loads `.env.development`)
- **THEN** `process.env.NEXT_PUBLIC_DEV_TOOLS` equals `'true'` and the dev-tools bootstrap component renders

#### Scenario: Dev tools eliminated in production build
- **WHEN** `next build` is run without `NEXT_PUBLIC_DEV_TOOLS=true`
- **THEN** all code branches guarded by `process.env.NEXT_PUBLIC_DEV_TOOLS === 'true'` are eliminated as dead code by the bundler, and no dev-tools modules appear in the production bundle

### Requirement: Webpack production build failsafe
The `next.config.ts` SHALL include a Webpack `IgnorePlugin` that rejects any import resolving to the `src/dev-tools/` directory when `NODE_ENV` is `'production'`.

#### Scenario: Accidental dev-tools import in production build
- **WHEN** a production build is attempted AND any module imports from `@/dev-tools/*` without being eliminated by the env guard
- **THEN** the build SHALL fail with an error, preventing deployment of dev-tools code

#### Scenario: Dev-tools imports work in development
- **WHEN** a development build is run (`next dev`)
- **THEN** the Webpack `IgnorePlugin` is NOT active and dev-tools imports resolve normally

### Requirement: Deploy-time file exclusion
The `src/dev-tools/` directory SHALL be excluded from production deploy artifacts via `.dockerignore` and `.vercelignore`.

#### Scenario: Docker build excludes dev-tools source
- **WHEN** a Docker image is built using the project Dockerfile
- **THEN** the `src/dev-tools/` directory is NOT copied into the Docker build context and does not exist in the final image

#### Scenario: Vercel deploy excludes dev-tools source
- **WHEN** the project is deployed to Vercel
- **THEN** the `src/dev-tools/` directory is excluded from the deployment upload

### Requirement: ESLint import boundary enforcement
An ESLint `no-restricted-imports` rule SHALL prevent files in `src/app/`, `src/components/`, `src/lib/`, and `src/hooks/` from importing any module matching `@/dev-tools/*`.

#### Scenario: Production code attempts to import dev-tools
- **WHEN** a file in `src/lib/` (or any other production directory) contains `import ... from '@/dev-tools/...'`
- **THEN** ESLint SHALL report an error with a message explaining the boundary violation

#### Scenario: Dev-tools code imports production code
- **WHEN** a file in `src/dev-tools/` imports from `@/lib/...` or `@/components/...`
- **THEN** ESLint SHALL NOT report an error (one-way dependency flow is allowed)

#### Scenario: Root layout bootstrap override
- **WHEN** `src/app/layout.tsx` imports the `DevToolsBootstrap` component from `@/dev-tools/`
- **THEN** ESLint SHALL NOT report an error for that specific file (override configured)

### Requirement: Bootstrap mount in root layout
The root layout (`src/app/layout.tsx`) SHALL conditionally render a `DevToolsBootstrap` component, guarded by the `NEXT_PUBLIC_DEV_TOOLS` env check. This is the sole integration point between production routing and the dev-tools system.

#### Scenario: Dev tools render in development
- **WHEN** the app runs in development with `NEXT_PUBLIC_DEV_TOOLS=true`
- **THEN** the `DevToolsBootstrap` component renders within the root layout, mounting the dev-tools shell

#### Scenario: Zero footprint in production
- **WHEN** the app runs in production
- **THEN** the `DevToolsBootstrap` import and render branch are completely eliminated — no component mounts, no DOM elements are created, and zero additional bytes are downloaded
