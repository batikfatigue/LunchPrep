name: "Phase 3: Customisation & UI — Category Management, BYOK, File Upload, Inline Editing, Pipeline Steps"
description: |

## Purpose
Full implementation plan for Phase 3 of LunchPrep. Provides complete context, type
contracts, pseudocode, and executable validation gates so the agent can build and
validate in one pass without gaps.

## Core Principles
1. **Context is King**: All interfaces, data shapes, existing code, and edge cases are documented here.
2. **Validation Loops**: Every gate is a runnable command; run and fix before moving on.
3. **Progressive Success**: Build and test each module before wiring them together.
4. **Global rules**: Follow all rules in CLAUDE.md (strict TypeScript, JSDoc, 500-line limit, named exports, tests).

---

## Goal

Implement Phase 3 of LunchPrep — Customisation & UI Polish. Wire up the complete
end-to-end wizard UI: Upload CSV → Review & Edit → Export CSV. The five deliverables are:

1. **Category Management UI** (`src/components/category-editor.tsx`) — add, remove, reorder
   custom categories. Persist to localStorage, fall back to defaults.
2. **BYOK API Key Input** (`src/components/api-key-input.tsx`) — store user's Gemini API
   key in localStorage, show active mode indicator, route calls directly to Gemini.
3. **File Upload** (`src/components/file-upload.tsx`) — drag-and-drop zone with file picker,
   accepts `.csv` files only.
4. **Enhanced Transaction Table** (update `src/components/transaction-table.tsx`) — add
   inline editing for payee and notes, add summary row (total debits, credits, net).
5. **Pipeline Step Indicator** (`src/components/pipeline-steps.tsx`) — visual
   Upload → Review → Export flow indicator.
6. **Main Page Wizard** (update `src/app/page.tsx`) — orchestrate all components into
   the working end-to-end pipeline.

## Why
- Users need a complete working UI to upload CSVs, review AI categorisations, and export
- Category customisation lets users tailor categories to their spending patterns
- BYOK removes dependency on the hosted proxy for power users
- Inline editing provides transparency — users can correct AI mistakes before export

## What

### User-Visible Behavior
1. User opens the app → sees Upload step with drag-and-drop zone
2. User drops/selects a CSV → file is parsed → moves to Review step
3. Review step shows transaction table with AI categories pre-filled (or manual fallback)
4. User can inline-edit payee, notes, and category for any row
5. Summary row shows total debits, total credits, and net amount
6. User can manage custom categories via a side panel/section
7. User can enter a BYOK Gemini API key (shown as active when set)
8. User clicks Export → downloads Lunch Money CSV

### Success Criteria
- [ ] File upload works via drag-and-drop AND file picker, accepts only .csv
- [ ] Pipeline steps indicator shows current step visually
- [ ] Transaction table supports inline editing of payee, notes, and category
- [ ] Summary row displays correct totals (debits, credits, net)
- [ ] Red/green colour coding for debit/credit amounts (already exists, preserve it)
- [ ] Category editor allows add, remove, reorder; persists to localStorage
- [ ] BYOK input stores key securely, shows active indicator, clears properly
- [ ] Full wizard flow works end-to-end: Upload → parse → categorise → review → export
- [ ] All new code has unit tests (min 3 per feature: happy path, edge case, failure)
- [ ] All components are responsive (mobile-friendly)
- [ ] No files exceed 500 lines
- [ ] `npm run build` passes with zero errors
- [ ] `npm test` passes with zero failures

---

## All Needed Context

### Documentation & References

```yaml
# MUST READ before implementing
- file: CLAUDE.md
  why: Global rules — strict TS, JSDoc, 500-line limit, named exports, test structure

- file: docs/architecture.md
  why: Directory structure showing where each file goes, data flow diagram, core interfaces

- file: docs/todo.md
  why: Phase 3 checklist items to mark as completed when done

- file: docs/prd.md
  why: Product requirements — privacy-first, client-side processing, review step

- file: src/lib/parsers/types.ts
  why: RawTransaction interface — the core data shape flowing through the entire pipeline

- file: src/lib/categoriser/categories.ts
  why: DEFAULT_CATEGORIES, loadCategories(), saveCategories() — ALREADY IMPLEMENTED.
       The category editor UI will call these existing functions.

- file: src/lib/categoriser/client.ts
  why: getBYOKKey(), setBYOKKey(), callCategorise() — ALREADY IMPLEMENTED.
       BYOK storage and routing logic exists. The UI component just wraps these.

- file: src/lib/anonymiser/pii.ts
  why: anonymise() and restore() — called in the pipeline before/after categorisation

- file: src/lib/exporter/lunchmoney.ts
  why: generateLunchMoneyCsv() and downloadCsv() — called at export step

- file: src/lib/parsers/registry.ts
  why: detectAndParse() — called when user uploads a CSV file

- file: src/components/transaction-table.tsx
  why: EXISTING component to EXTEND — currently has category dropdowns, loading/error
       overlays. NEEDS: inline payee/notes editing, summary row, onPayeeChange/onNotesChange props.

- file: src/components/ui/button.tsx
  why: Pattern reference for shadcn/ui component structure (CVA variants, cn() usage)

- file: src/app/page.tsx
  why: Currently a placeholder — will be REPLACED with full wizard UI

- file: src/app/layout.tsx
  why: Root layout with Inter font, metadata — no changes needed

- file: tests/exporter/lunchmoney.test.ts
  why: Test pattern reference — makeTx() helper, describe/it structure, vi.fn() mocking

- url: https://ui.shadcn.com/docs/components/input
  why: shadcn Input component API for adding via CLI

- url: https://ui.shadcn.com/docs/components/badge
  why: shadcn Badge component for BYOK active indicator

- url: https://ui.shadcn.com/docs/components/card
  why: shadcn Card component for upload zone and settings panels

- url: https://v4.tailwindcss.com/docs
  why: Tailwind CSS v4 utility class reference

- url: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
  why: Native HTML5 drag-and-drop events for file upload
```

### Current Codebase Tree

```
src/
├── app/
│   ├── api/categorise/route.ts   # Gemini proxy (no changes needed)
│   ├── globals.css                # Tailwind/shadcn theme (no changes needed)
│   ├── layout.tsx                 # Root layout (no changes needed)
│   └── page.tsx                   # REPLACE — placeholder → full wizard
├── components/
│   ├── transaction-table.tsx      # UPDATE — add inline editing + summary row
│   └── ui/
│       └── button.tsx             # Existing shadcn component
├── lib/
│   ├── anonymiser/pii.ts          # anonymise(), restore() (no changes)
│   ├── categoriser/
│   │   ├── categories.ts          # loadCategories(), saveCategories() (no changes)
│   │   ├── client.ts              # getBYOKKey(), setBYOKKey(), callCategorise() (no changes)
│   │   └── prompt.ts              # buildPrompt() (no changes)
│   ├── exporter/lunchmoney.ts     # generateLunchMoneyCsv(), downloadCsv() (no changes)
│   ├── parsers/
│   │   ├── data/dbs_codes.json
│   │   ├── data/fast_purpose_codes.json
│   │   ├── dbs.ts
│   │   ├── registry.ts            # detectAndParse() (no changes)
│   │   └── types.ts               # RawTransaction, BankParser (no changes)
│   └── utils.ts                   # cn() helper (no changes)
tests/
├── anonymiser/pii.test.ts
├── categoriser/prompt.test.ts
├── exporter/lunchmoney.test.ts
├── parsers/dbs.test.ts
└── setup.test.ts
```

### Desired Codebase Tree (new/modified files marked)

```
src/
├── app/
│   └── page.tsx                          # MODIFIED — full wizard UI
├── components/
│   ├── api-key-input.tsx                 # NEW — BYOK key input + active indicator
│   ├── category-editor.tsx               # NEW — add/remove/reorder categories
│   ├── file-upload.tsx                   # NEW — drag-and-drop + file picker
│   ├── pipeline-steps.tsx                # NEW — Upload → Review → Export indicator
│   ├── transaction-table.tsx             # MODIFIED — inline editing + summary row
│   └── ui/
│       ├── badge.tsx                     # NEW — added via shadcn CLI
│       ├── button.tsx                    # existing
│       ├── card.tsx                      # NEW — added via shadcn CLI
│       └── input.tsx                     # NEW — added via shadcn CLI
├── hooks/
│   └── use-local-storage.ts             # NEW — generic localStorage sync hook
tests/
├── hooks/use-local-storage.test.ts      # NEW
├── components/
│   ├── file-upload.test.ts              # NEW
│   └── transaction-table.test.ts        # NEW
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: radix-ui v1.4 is the UNIFIED package — imports are:
import { Select, Dialog } from "radix-ui";
// NOT the old @radix-ui/react-select pattern.

// CRITICAL: shadcn/ui is configured as "new-york" style with "radix-ui" (unified).
// Add components via: npx shadcn@latest add input badge card
// They will be placed in src/components/ui/ automatically.

// CRITICAL: components.json has hooks alias "@/hooks" — so create hooks in src/hooks/.

// CRITICAL: vitest uses happy-dom environment. happy-dom provides localStorage,
// document, window, etc. Tests CAN access localStorage directly.

// CRITICAL: Next.js page.tsx MUST use default export (Next.js convention).
// All other components use named exports per coding-standards.md.

// CRITICAL: "use client" directive is REQUIRED at the top of:
// - All new components (they use React state/effects/event handlers)
// - page.tsx (it orchestrates client-side state)

// CRITICAL: The existing transaction-table.tsx uses radix-ui Select directly
// (not a shadcn Select wrapper). Keep this pattern for consistency.

// CRITICAL: When extending TransactionTableProps, add NEW optional props so
// the existing interface remains backward-compatible during development.

// GOTCHA: localStorage is unavailable during SSR. All localStorage access
// must be guarded with: if (typeof window === "undefined") return;
// The existing loadCategories() and getBYOKKey() already do this.

// GOTCHA: PapaParse is already installed but file reading uses FileReader API
// in the browser. Read the File as text, then pass to detectAndParse().

// GOTCHA: callCategorise() expects ANONYMISED transactions. The pipeline is:
//   1. detectAndParse(csvContent) → RawTransaction[]
//   2. anonymise(transactions) → RawTransaction[] (with mocked PII)
//   3. callCategorise(anonymisedTxs, categories) → CategorisationResult[]
//   4. restore(anonymisedTxs) → RawTransaction[] (original PII back)
//   5. Apply categories from results to restored transactions
// The page.tsx orchestrator must follow this exact order.

// GOTCHA: The amount field on RawTransaction is already signed:
//   negative = debit/expense, positive = credit/income
// Summary calculations: debits = sum of negative amounts, credits = sum of positive amounts.
```

---

## Implementation Blueprint

### Data Models & Interfaces

```typescript
// --- src/hooks/use-local-storage.ts ---
// Generic hook: useLocalStorage<T>(key: string, initialValue: T) => [T, (value: T) => void]
// Reads from localStorage on mount, writes on set, handles SSR guard.

// --- src/components/pipeline-steps.tsx ---
export type PipelineStep = "upload" | "review" | "export";
export interface PipelineStepsProps {
  currentStep: PipelineStep;
}

// --- src/components/file-upload.tsx ---
export interface FileUploadProps {
  /** Called when user selects or drops a valid CSV file. */
  onFileSelect: (file: File) => void;
  /** Whether a file is currently being processed. */
  isLoading?: boolean;
  /** Error message to display (e.g. invalid file type). */
  error?: string | null;
}

// --- src/components/api-key-input.tsx ---
export interface ApiKeyInputProps {
  /** Current API key value (empty string if not set). */
  apiKey: string;
  /** Called when user saves or clears the API key. */
  onApiKeyChange: (key: string) => void;
}

// --- src/components/category-editor.tsx ---
export interface CategoryEditorProps {
  /** Current list of categories. */
  categories: string[];
  /** Called when categories are modified (add/remove/reorder). */
  onCategoriesChange: (categories: string[]) => void;
}

// --- EXTENDED TransactionTableProps (update existing) ---
// Add these NEW optional props to the existing interface:
export interface TransactionTableProps {
  // ... existing props unchanged ...
  /** Callback fired when user edits a payee name inline. */
  onPayeeChange?: (index: number, payee: string) => void;
  /** Callback fired when user edits notes inline. */
  onNotesChange?: (index: number, notes: string) => void;
}
```

### Task List (ordered)

```yaml
Task 0: Install shadcn UI dependencies
  DESCRIPTION: Add shadcn input, badge, card components via CLI.
  COMMANDS:
    - npx shadcn@latest add input badge card
  VALIDATION: Verify files exist at src/components/ui/input.tsx, badge.tsx, card.tsx

Task 1: Create useLocalStorage hook
  CREATE src/hooks/use-local-storage.ts
  MIRROR PATTERN FROM: src/lib/categoriser/categories.ts (SSR guard, JSON parse/stringify)
  WHY FIRST: Multiple components depend on this hook for localStorage sync.

Task 2: Create pipeline-steps.tsx
  CREATE src/components/pipeline-steps.tsx
  DESCRIPTION: Visual step indicator showing Upload → Review → Export.
  WHY EARLY: Simple component, no dependencies on others. Good warm-up.

Task 3: Create file-upload.tsx
  CREATE src/components/file-upload.tsx
  DESCRIPTION: Drag-and-drop zone + file picker button. Accepts .csv only.
  USES: Button from @/components/ui/button, Card from @/components/ui/card
  USES: lucide-react icons (Upload, FileText, etc.)
  PATTERN: Native HTML5 drag events (dragover, dragleave, drop) + hidden <input type="file">

Task 4: Create api-key-input.tsx
  CREATE src/components/api-key-input.tsx
  DESCRIPTION: Input field for Gemini API key with show/hide toggle and active indicator.
  USES: Input from @/components/ui/input, Button, Badge from @/components/ui/badge
  USES: lucide-react icons (Eye, EyeOff, Key, X)
  CALLS: setBYOKKey() from @/lib/categoriser/client.ts (existing function)

Task 5: Create category-editor.tsx
  CREATE src/components/category-editor.tsx
  DESCRIPTION: List of categories with add/remove/reorder (up/down buttons).
  USES: Input, Button from shadcn/ui
  USES: lucide-react icons (Plus, X, ChevronUp, ChevronDown)
  CALLS: saveCategories() from @/lib/categoriser/categories.ts (existing function)
  REORDER: Use simple array manipulation (swap adjacent elements) — no DnD library needed.

Task 6: Update transaction-table.tsx — inline editing + summary row
  MODIFY src/components/transaction-table.tsx
  ADD: onPayeeChange and onNotesChange optional callback props
  ADD: Inline editing — click payee/notes cell to show <input>, blur/Enter to save
  ADD: Summary row at bottom of table — total debits, total credits, net amount
  PRESERVE: All existing functionality (category dropdown, loading overlay, error banner)
  PRESERVE: Red/green colour coding (already implemented)
  KEEP UNDER: 500 lines

Task 7: Create page.tsx — full wizard orchestration
  MODIFY src/app/page.tsx (replace placeholder)
  DESCRIPTION: Main page wiring all components together with step-based flow.
  MUST USE "use client" and default export (Next.js requirement).
  STATE:
    - step: PipelineStep ("upload" | "review" | "export")
    - transactions: RawTransaction[]
    - categoryMap: Map<number, string>
    - categories: string[] (from useLocalStorage, fallback DEFAULT_CATEGORIES)
    - apiKey: string (from useLocalStorage, fallback "")
    - status: CategorisationStatus
    - error: string | null
  HANDLERS:
    - handleFileSelect(file: File) → read text → detectAndParse() → set transactions → go to "review"
    - handleCategorise() → anonymise → callCategorise → restore → populate categoryMap
    - handleExport() → generateLunchMoneyCsv → downloadCsv → go to "export"
    - handlePayeeChange(idx, payee) → update transactions[idx].description
    - handleNotesChange(idx, notes) → update transactions[idx].notes
    - handleCategoryChange(idx, cat) → update categoryMap
    - handleCategoriesChange(cats) → update categories state (localStorage synced by hook)
    - handleApiKeyChange(key) → update apiKey state + setBYOKKey()
    - handleReset() → reset all state, go back to "upload"
  LAYOUT:
    - Header: app title + BYOK indicator
    - PipelineSteps at top
    - Step "upload": FileUpload component centred, CategoryEditor + ApiKeyInput in sidebar/below
    - Step "review": TransactionTable filling main area, "Categorise" + "Export" buttons
    - Step "export": Success message + "Start Over" button

Task 8: Write tests
  CREATE tests/hooks/use-local-storage.test.ts
    - Test: reads initial value from localStorage
    - Test: writes updated value to localStorage
    - Test: falls back to initial value when localStorage is empty
    - Test: handles malformed JSON in localStorage gracefully

  CREATE tests/components/file-upload.test.ts
    - Test: accepts .csv files (validate helper logic)
    - Test: rejects non-.csv files
    - Test: edge case — empty file name

  CREATE tests/components/transaction-table.test.ts
    - Test: summary row calculates correct totals (debits, credits, net)
    - Test: handles empty transaction list (zeros)
    - Test: handles all-debit or all-credit lists
    NOTE: Extract summary calculation as a pure function for easy testing.

Task 9: Update docs/todo.md
  Mark all Phase 3 items as completed [x].

Task 10: Final validation
  Run all validation gates (see below).
```

### Per-Task Pseudocode

#### Task 1: useLocalStorage hook

```typescript
// src/hooks/use-local-storage.ts
"use client";
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Lazy initialiser reads from localStorage (SSR-safe)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Write to localStorage whenever value changes
  // PATTERN: Use useEffect, not direct write in setter, to keep SSR safe
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore quota errors
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
```

#### Task 2: pipeline-steps.tsx

```typescript
// src/components/pipeline-steps.tsx
"use client";
// Three steps: Upload, Review, Export
// Render as horizontal flex with connectors
// Current step: primary colour + bold
// Completed steps: muted with checkmark
// Future steps: muted/disabled

// PATTERN: Use cn() for conditional classes
// ICONS: Upload, FileSearch, Download from lucide-react
// RESPONSIVE: Stack vertically on mobile (flex-col sm:flex-row)
```

#### Task 3: file-upload.tsx

```typescript
// src/components/file-upload.tsx
"use client";
// Card-based drop zone with dashed border
// States: idle, drag-over (highlight border), loading, error, file-selected
// Drag events: onDragOver (preventDefault + highlight), onDragLeave, onDrop (extract file)
// Hidden <input type="file" accept=".csv"> triggered by button click
// Validate: file.name.endsWith(".csv") before calling onFileSelect
// Show selected filename after successful selection

// PSEUDOCODE:
function handleDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.name.toLowerCase().endsWith(".csv")) {
    setError("Please select a CSV file");
    return;
  }
  onFileSelect(file);
}
```

#### Task 4: api-key-input.tsx

```typescript
// src/components/api-key-input.tsx
"use client";
// Input with type toggle (password ↔ text) via Eye/EyeOff icon button
// Save button commits key to parent state (which syncs to localStorage via hook)
// When key is active: show Badge variant="default" with "BYOK Active" + Key icon
// Clear button (X icon) to remove key
// CRITICAL: Never log the key. No console.log in this component.
// Validation: key must be non-empty string when saving

// Layout: flex row — input + show/hide button + save/clear button
// Below input: Badge indicator (visible only when key is set)
```

#### Task 5: category-editor.tsx

```typescript
// src/components/category-editor.tsx
"use client";
// Vertical list of categories with action buttons per row
// Each row: [category name] [up button] [down button] [remove button]
// Bottom: input + "Add" button for new categories
// Reorder: swap elements in array (immutable — create new array)
// Validation: no empty strings, no duplicates (case-insensitive)
// On any change: call onCategoriesChange(newList) — parent persists via hook
// "Reset to Defaults" button at bottom that restores DEFAULT_CATEGORIES

// PSEUDOCODE for reorder:
function moveUp(index: number) {
  if (index <= 0) return;
  const updated = [...categories];
  [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
  onCategoriesChange(updated);
}
```

#### Task 6: transaction-table.tsx updates

```typescript
// MODIFY src/components/transaction-table.tsx
// ADD to TransactionTableProps:
//   onPayeeChange?: (index: number, payee: string) => void;
//   onNotesChange?: (index: number, notes: string) => void;

// INLINE EDITING pattern:
// - Wrap payee/notes cells in an EditableCell sub-component
// - Default state: show text
// - On click: show <input> with current value, auto-focus
// - On blur or Enter: commit change via callback
// - On Escape: cancel edit, revert to original value

// SUMMARY ROW: Add after </tbody> as a <tfoot>
// EXTRACT as pure function for testability:
export function computeSummary(transactions: RawTransaction[]): {
  totalDebits: number;
  totalCredits: number;
  net: number;
} {
  let totalDebits = 0;
  let totalCredits = 0;
  for (const tx of transactions) {
    if (tx.amount < 0) totalDebits += tx.amount;
    else totalCredits += tx.amount;
  }
  return { totalDebits, totalCredits, net: totalCredits + totalDebits };
}
// Render in <tfoot> with same column alignment, bold text
```

#### Task 7: page.tsx orchestration

```typescript
// src/app/page.tsx
"use client";
// MUST be default export (Next.js convention)
// USE: useLocalStorage for categories + apiKey
// USE: useState for transactions, categoryMap, status, step, error

// FILE READING:
async function handleFileSelect(file: File) {
  const text = await file.text(); // File.text() returns Promise<string>
  const result = detectAndParse(text); // from @/lib/parsers/registry
  if (!result) { setError("Unrecognised CSV format"); return; }
  setTransactions(result.transactions);
  setStep("review");
  // Auto-trigger categorisation
  triggerCategorise(result.transactions);
}

// CATEGORISATION PIPELINE:
async function triggerCategorise(txs: RawTransaction[]) {
  setStatus("loading");
  try {
    const anonymised = anonymise(txs);
    const results = await callCategorise(anonymised, categories, apiKey || undefined);
    const restored = restore(anonymised);
    setTransactions(restored);
    const map = new Map<number, string>();
    for (const r of results) map.set(r.index, r.category);
    setCategoryMap(map);
    setStatus("done");
  } catch (err) {
    setStatus("error");
    // User can still manually categorise
  }
}

// EXPORT:
function handleExport() {
  // Apply inline edits (already in state) and categories
  const csv = generateLunchMoneyCsv(transactions, categoryMap);
  downloadCsv(csv);
  setStep("export");
}

// LAYOUT:
// <main className="mx-auto max-w-5xl px-4 py-8">
//   <header> LunchPrep title + BYOK badge </header>
//   <PipelineSteps currentStep={step} />
//   {step === "upload" && (
//     <div className="grid gap-6 lg:grid-cols-3">
//       <div className="lg:col-span-2"> <FileUpload /> </div>
//       <div className="space-y-4"> <ApiKeyInput /> <CategoryEditor /> </div>
//     </div>
//   )}
//   {step === "review" && (
//     <TransactionTable ... />
//     <div> <Button onClick={handleCategorise}>Re-categorise</Button>
//            <Button onClick={handleExport}>Export CSV</Button> </div>
//   )}
//   {step === "export" && ( success view + Start Over button )}
// </main>
```

### Integration Points

```yaml
SHADCN_CLI:
  - command: "npx shadcn@latest add input badge card"
  - creates: src/components/ui/input.tsx, badge.tsx, card.tsx
  - NOTE: Run BEFORE creating any components that import these

LOCALSTORAGE_KEYS:
  - "lunchprep_categories" — used by loadCategories/saveCategories (existing)
  - "lunchprep_gemini_key" — used by getBYOKKey/setBYOKKey (existing)
  - The useLocalStorage hook should use the SAME keys to stay in sync.
  - CRITICAL: For categories, use useLocalStorage("lunchprep_categories", DEFAULT_CATEGORIES)
  - CRITICAL: For API key, use useLocalStorage("lunchprep_gemini_key", "")

EXISTING_FUNCTIONS_TO_CALL (do NOT rewrite these):
  - detectAndParse(csvContent: string) → { bankName: string; transactions: RawTransaction[] } | null
  - anonymise(transactions: RawTransaction[]) → RawTransaction[]
  - restore(transactions: RawTransaction[]) → RawTransaction[]
  - callCategorise(txs, categories?, byokKey?) → Promise<CategorisationResult[]>
  - generateLunchMoneyCsv(txs, categoryMap?) → string
  - downloadCsv(csvContent, filename?) → void
  - loadCategories() → string[]
  - saveCategories(categories: string[]) → void
  - getBYOKKey() → string | null
  - setBYOKKey(key: string | null) → void
  - DEFAULT_CATEGORIES: string[] (the constant array)
```

---

## Validation Loop

### Level 0: Install Dependencies

```bash
# Add shadcn components (run FIRST)
npx shadcn@latest add input badge card

# Verify they were created
ls src/components/ui/input.tsx src/components/ui/badge.tsx src/components/ui/card.tsx
```

### Level 1: Type Checking & Build

```bash
# After each task, run type check:
npx tsc --noEmit

# After all tasks, run full build:
npm run build

# Expected: Zero errors. If errors, READ the error, fix the source, re-run.
```

### Level 2: Lint

```bash
npm run lint

# Expected: Zero errors. Fix any issues before proceeding.
```

### Level 3: Unit Tests

```bash
# Run all tests:
npm test -- --run

# Run specific test files as you create them:
npx vitest run tests/hooks/use-local-storage.test.ts
npx vitest run tests/components/file-upload.test.ts
npx vitest run tests/components/transaction-table.test.ts

# IMPORTANT: Existing tests must still pass:
npx vitest run tests/parsers/dbs.test.ts
npx vitest run tests/exporter/lunchmoney.test.ts
npx vitest run tests/anonymiser/pii.test.ts
npx vitest run tests/categoriser/prompt.test.ts
```

### Level 4: Visual Verification

```bash
# Start dev server and manually verify:
npm run dev
# Open http://localhost:3000
# Check: upload step shows, drag-drop works, pipeline steps render,
#         review table shows, inline editing works, export downloads CSV
```

## Final Validation Checklist

- [ ] All tests pass: `npm test -- --run`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] No lint errors: `npm run lint`
- [ ] File upload works (drag-and-drop + file picker)
- [ ] Pipeline steps indicator shows correct step
- [ ] Transaction table inline editing works (payee, notes, category)
- [ ] Summary row shows correct totals
- [ ] Category editor: add, remove, reorder, persists to localStorage
- [ ] BYOK input: store, show/hide, clear, active indicator
- [ ] Full flow: Upload CSV → Review → Export CSV download
- [ ] No file exceeds 500 lines
- [ ] `docs/todo.md` Phase 3 items marked as [x]
- [ ] All new functions have JSDoc comments
- [ ] Components are responsive (test at 375px width)

---

## Anti-Patterns to Avoid

- Do NOT rewrite existing lib functions (anonymise, callCategorise, loadCategories, etc.) — call them as-is
- Do NOT use default exports for components (only page.tsx gets default export)
- Do NOT use inline styles or CSS modules — Tailwind only
- Do NOT use `any` type — proper interfaces for all data shapes
- Do NOT send raw PII to the categorisation API — always anonymise first
- Do NOT log API keys to console
- Do NOT add drag-and-drop libraries for category reorder — simple array swap is sufficient
- Do NOT skip the "use client" directive on client components
- Do NOT forget to handle the SSR guard (typeof window === "undefined") in localStorage code
- Do NOT exceed 500 lines in any single file — split into sub-components if needed
