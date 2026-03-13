## Why

Currently, the Pipeline Inspector only allows sequential navigation (Previous/Next) or jumping from the main table. This makes it difficult to see high-level patterns across all flagged transactions. Developing cleaning strategies (e.g., regex fixes for specific merchant strings) requires seeing these flagged items in a consolidated view to identify commonalities in their raw descriptions.

## What Changes

We will introduce a high-level "Flag Summary Overlay" within the Pipeline Inspector. This overlay will be a data-rich modal taking up most of the screen (90% width, 80% height), providing a tabular view of all transactions currently marked with a "Flag" status and their associated notes.

Key changes:
- Keyboard shortcut `S` to toggle the summary overlay.
- Interactive summary table: Clicking a flagged row closes the overlay and jumps the inspector to that transaction.

## Capabilities

### New Capabilities
- `flag-summary-overlay`: Provides a consolidated, high-level view of flagged transactions to identify patterns and plan cleaning strategies.

### Modified Capabilities
- `pipeline-inspector`: Add header integration for the summary button and the `S` keyboard shortcut handler.

## Impact

- `src/dev-tools/pipeline-inspector/`: New `flag-summary-overlay.tsx` component and updates to `index.tsx` for state and keyboard handling.
- No impact on production bundles (gated by `NEXT_PUBLIC_DEV_TOOLS`).
