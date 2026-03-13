## 1. Create Flag Summary Component

- [x] 1.1 Create `src/dev-tools/pipeline-inspector/flag-summary-overlay.tsx`.
- [x] 1.2 Implement the 90vw/80vh modal wrapper with Backdrop Blur.
- [x] 1.3 Implement the table view for flagged items (Index, Raw Description, Note).
- [x] 1.4 Add "Close" button and "Jump to Transaction" row click handler.

## 2. Integrate with Pipeline Inspector

- [x] 2.1 Update `src/dev-tools/pipeline-inspector/index.tsx` to add `isSummaryOpen` state.
- [x] 2.2 Update keyboard hints in the inspector header to include "S summary".
- [x] 2.3 Implement the keyboard shortcut `S` (and `s`) in `handlePanelKeyDown`.
- [x] 2.4 Render the `FlagSummaryOverlay` component conditionally based on state.

## 3. Verification

- [x] 3.1 Manually flag a few transactions and check if they appear in the summary.
- [x] 3.2 Verify clicking a row closes the overlay and scrolls/focuses the correct transaction.
- [x] 3.3 Ensure the overlay is fully excluded from production (check gated import).
