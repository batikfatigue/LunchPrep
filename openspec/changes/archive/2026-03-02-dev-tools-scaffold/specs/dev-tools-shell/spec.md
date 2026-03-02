## ADDED Requirements

### Requirement: DevTool interface contract
The system SHALL define a `DevTool` TypeScript interface that all registered tools must satisfy. The interface MUST include: `id` (unique string identifier), `name` (display name), `description` (short description), `mode` (one of `'panel'`, `'standalone'`, or `'both'`), and `component` (React component type). An optional `icon` field (React node) MAY be provided.

#### Scenario: Tool implements the interface
- **WHEN** a developer creates a new dev tool
- **THEN** they export an object satisfying the `DevTool` interface with all required fields

#### Scenario: TypeScript enforces the contract
- **WHEN** a registry entry is missing a required field (e.g., `mode`)
- **THEN** the TypeScript compiler SHALL report a type error

### Requirement: Manual tool registry
The system SHALL provide a `_registry.ts` file exporting a typed array of `DevTool` objects. Adding a tool MUST require only adding one entry to this array. The registry MUST NOT use dynamic discovery, filesystem scanning, or decorator patterns.

#### Scenario: Adding a new tool
- **WHEN** a developer wants to register a new dev tool
- **THEN** they add one `DevTool` entry to the `DEV_TOOLS` array in `_registry.ts`

#### Scenario: Removing a tool
- **WHEN** a developer removes a tool's registry entry from `_registry.ts` and deletes its directory
- **THEN** the tool is fully removed with no residual references or side effects

#### Scenario: Empty registry
- **WHEN** the `DEV_TOOLS` array is empty (no tools registered)
- **THEN** the shell renders with no tools available and displays an empty state message

### Requirement: Floating panel mode
The shell SHALL provide a floating panel overlay that renders on top of existing app pages. The panel MUST be collapsible to a minimal toolbar. The panel MUST contain a tool selector that lists all registered tools with `mode` of `'panel'` or `'both'`. Selecting a tool SHALL render that tool's component inside the panel.

#### Scenario: Panel renders in development
- **WHEN** the app runs in development with dev tools enabled and at least one panel-mode tool is registered
- **THEN** a floating panel appears overlaying the page content with a tool selector

#### Scenario: Panel is collapsible
- **WHEN** the user collapses the floating panel
- **THEN** the panel reduces to a minimal toolbar (e.g., a small icon/button) that does not obstruct the production UI

#### Scenario: Panel is expandable
- **WHEN** the user clicks the collapsed toolbar
- **THEN** the panel expands to reveal the tool selector and the active tool's content

#### Scenario: Tool selection
- **WHEN** the user selects a tool from the panel's tool selector
- **THEN** the selected tool's React component renders inside the panel body

### Requirement: Standalone page mode
The shell SHALL provide a standalone full-screen mode for tools that need their own dedicated page. Standalone tools MUST be accessible via navigation from the floating panel toolbar. Standalone routes SHALL be defined within `src/dev-tools/` and protected by the same env guard and Webpack exclusion as all other dev-tools code.

#### Scenario: Navigating to a standalone tool
- **WHEN** the user clicks a standalone tool's link in the floating panel toolbar
- **THEN** a full-screen view renders the tool's component, replacing or overlaying the current page content

#### Scenario: Returning from standalone to panel
- **WHEN** the user is viewing a standalone tool and wants to return
- **THEN** there is a navigation mechanism (e.g., back button, close button) to return to the normal app view

### Requirement: Visual dev-tools indicator
The shell MUST render a persistent visual indicator (e.g., a distinctive coloured border, badge, or toolbar) when dev tools are active so the developer always knows they are running in dev mode. This indicator SHALL be part of the shell, not individual tools.

#### Scenario: Dev mode is visually obvious
- **WHEN** the app runs with dev tools enabled
- **THEN** a persistent visual element (e.g., coloured toolbar, badge) is visible indicating dev mode is active

#### Scenario: Indicator does not interfere with production UI testing
- **WHEN** the floating panel is collapsed
- **THEN** the visual indicator remains minimal and does not meaningfully obscure the production UI
