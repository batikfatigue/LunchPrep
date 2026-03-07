## 1. Backend Modifications

- [x] 1.1 Update categorisation logic to conditionally request Gemini reasoning based on `NEXT_PUBLIC_DEV_TOOLS` flag
- [x] 1.2 Modify endpoint response to include raw API payload and Gemini's reasoning alongside categorisation results in dev mode

## 2. Dev-Tool UI Components

- [x] 2.1 Create the main `PipelineReviewerDevTool` component within `src/dev-tools/` boundary
- [x] 2.2 Implement the overlay/modal container for the dev-tool
- [x] 2.3 Build the data table to display transaction data, raw payloads, and Gemini responses
- [x] 2.4 Implement expandable rows within the table to reveal the interactive comment section and text area
- [x] 2.5 Add component-level state management to hold user's text annotations for each transaction
- [x] 2.6 Update data table to display row-specific Date, Amount, Raw Description, JSON Payload, JSON Output, and AI Reasoning
- [x] 2.7 Add utilities to extract row-specific payloads (excluding `valid_categories`) and row-specific output from the batched JSON
- [x] 2.8 Restrict expanded view to contain only the annotation text area

## 3. Export Functionality

- [x] 3.1 Implement a utility to compile all transaction data, debug payloads, and user comments into a formatted Markdown string
- [x] 3.2 Add a "Download/Export" button within the overlay that triggers the Markdown file download

## 4. Integration

- [x] 4.1 Add the `PipelineReviewerDevTool` entry point/button to the final review page using the dev-tools conditional rendering/registry logic
