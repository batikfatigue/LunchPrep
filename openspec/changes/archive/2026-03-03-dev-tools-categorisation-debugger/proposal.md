## Why

I want a personal annotation tool to help review our current categorisation logic. This will allow me to improve the accuracy of GEMINI's auto-categorisation for transactions by identifying additional data points that could be introduced (like confidence scores or prompts) and by implementing refined logic based on real-world examples.

## What Changes

- Add a new devtool button to the final review page that opens an overlay with a table containing advanced debugging data for all transactions.
- Expose the full raw transaction description, the exact API payload sent to Gemini, and the API output (including Gemini's thought process/reasoning and its final output) row by row, within this table.
- Implement an interactive comment section within the overlay that expands when a user clicks on a transaction row (and collapses when clicked again), allowing text annotations regarding the categorisation.
- Add an export feature within the overlay to download the reviewed transactions, associated debugging data, and user comments as a compiled Markdown file to streamline offline analysis.
- Modify the Gemini API request logic to strictly request and return reasoning/thought processes **only** when accessed within the devtool environment (this is to avoid compromising production code constraints).

## Capabilities

### New Capabilities
- `dev-tools-categorisation-debugger`: The UI layer and interaction logic for the review annotations, data display, and markdown export.

### Modified Capabilities
<!-- Leaving empty as no existing specs in openspec/specs/ cover transaction categorisation. We will keep the change scoped to the devtool. -->

## Impact

- **UI**: Enhances the final export review page with a new devtool button to open an overlay table containing the debugging panel.
- **Data Flow**: Requires passing the Gemini prompt, raw API payload, response, and thought process down to the client in the dev environment without breaking the production build flow.
- **Dependencies**: May require adjustments to the server-side action/API route calling Gemini to condition the request parameters based on environment.
