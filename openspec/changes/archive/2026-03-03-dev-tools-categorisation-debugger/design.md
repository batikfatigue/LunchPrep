## Context

Currently, the auto-categorisation of transactions rely on Gemini, but there is no way for the developer to see the prompt, raw API payload, or Gemini’s chain-of-thought inside the app. Developers want a personal annotation tool to evaluate the accuracy of current logic. Due to production constraints (cost, latency, and security), this debugging data cannot be exposed or requested in a production environment.

## Goals / Non-Goals

**Goals:**
- Provide a dev-tool overlay accessible from the review page to inspect API interactions row-by-row.
- Allow developers to annotate categorisation results directly in the UI.
- Enable exporting reviewed data and comments into a Markdown file for offline analysis.
- Ensure the dev-tool code, along with the request for Gemini's reasoning, is strictly excluded from production builds.
- Present data in a streamlined table with relevant row-specific data readily available before expansion (including Date, Amount, RawDescription, row-specific API Payload, row-specific API Output, and AI Reasoning).
- Keep the expanded row view clean, containing *only* the comment box for annotations.

**Non-Goals:**
- Modifying the core categorization logic itself; this tool is strictly for viewing and annotating.
- Extending dev-tool capabilities outside of the `src/dev-tools/` boundary.

## Decisions

- **Placement of Review Component**: The component will be placed in `src/dev-tools/` rather than the main UI components directory. This guarantees exclusion from production bundles using our existing `NEXT_PUBLIC_DEV_TOOLS` gate.
- **Conditional Reasoning Requests**: The backend endpoint calling Gemini will be modified to include instructions for reasoning *only* when `NEXT_PUBLIC_DEV_TOOLS === 'true'`. In production, this flag will be false, averting the extra cost and latency of chain-of-thought generation.
- **Table Data Extraction**: Instead of displaying the entire batched request/response JSONs, the table will extract and display only the specific JSON payload (`{ payee, notes, transactionType }`) and output (`{ category }`) relevant to each individual row. The `valid_categories` array will be excluded from the UI payload view.
- **Overlay UI**: Instead of inline expansions for each transaction row (which conflict with existing row-click functionality), the tool will open a separate overlay. This overlay will display the data in a dedicated table format. The expanded view for each row will be vastly simplified to contain only the text area for annotations.
- **Client-Side State for Annotations**: The typed annotations will be kept in local component state until the user exports them, rather than saving them to a database. This keeps the tool simple and stateless on the backend.

## Risks / Trade-offs

- **Risk**: A bug in the environment check might cause dev-tool data or components to leak into production builds.
  - **Mitigation**: Strictly use established dev-tools registry/shell and `NEXT_PUBLIC_DEV_TOOLS` flags. Rely on existing dead-code elimination patterns verified during build.
- **Risk**: The backend Gemini endpoint might become overly complex with conditional logic.
  - **Mitigation**: Abstract the conditional prompt adjustment into a discrete utility function that cleanly modifies the request payload based on the environment flag.
