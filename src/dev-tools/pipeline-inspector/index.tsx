"use client";

/**
 * Pipeline Inspector — dev tool for inspecting transaction state at each
 * pipeline stage (raw → afterClean → afterStripPII → anonymised → sent →
 * categorised → restored).
 *
 * Renders as an inline detail pane below the transaction table. Shows a
 * per-stage diff table for the selected transaction with field-level
 * change markers highlighting what changed at each step.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PipelineSnapshot, GeminiSentEntry } from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";
import SandboxInput, { type SandboxResult } from "@/dev-tools/pipeline-inspector/sandbox-input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineInspectorProps {
  /** Snapshot of transaction state at each pipeline stage. */
  snapshots: PipelineSnapshot;
  /** Index of the selected transaction row (null = no selection). */
  selectedIndex: number | null;
  /** Category list for sandbox Full Pipeline mode. */
  categories: string[];
  /** Gemini API key for sandbox Full Pipeline mode. */
  apiKey: string;
}

/** Ordered pipeline stage names — includes parse sub-stages derived from the `parsed` snapshot. */
const STAGE_ORDER = [
  "raw",
  "afterClean",
  "afterStripPII",
  "anonymised",
  "sent",
  "categorised",
  "restored",
] as const;
type StageName = (typeof STAGE_ORDER)[number];

/** Columns shown in the stage diff table. */
const COLUMNS = ["payee", "notes"] as const;
/** A normalised row for display — all stages mapped to the same shape. */
interface StageRow {
  stage: StageName;
  payee: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Pure helpers — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * Extract column values from a pipeline stage entry for the given transaction index.
 *
 * For parse sub-stages (raw, afterClean, afterStripPII), values are derived
 * from fields on the `RawTransaction` in the `parsed` snapshot entry.
 *
 * @param stage - Pipeline stage name.
 * @param data - Stage data (RawTransaction[] or GeminiSentEntry[]).
 * @param index - Transaction index to extract.
 * @returns Normalised StageRow, or null if the index is out of bounds or data is missing.
 */
export function extractRow(
  stage: StageName,
  data: RawTransaction[] | GeminiSentEntry[],
  index: number,
): StageRow | null {
  if (index < 0 || index >= data.length) return null;

  if (stage === "sent") {
    const entry = data[index] as GeminiSentEntry;
    return {
      stage,
      payee: entry.payee,
      notes: entry.notes,
    };
  }

  const tx = data[index] as RawTransaction;

  // Reason: Parse sub-stages are derived from fields on the RawTransaction
  // in the `parsed` snapshot, not from separate snapshot keys.
  if (stage === "raw") {
    return {
      stage,
      payee: tx.originalDescription,
      notes: "—",
    };
  }

  if (stage === "afterClean") {
    if (!tx.parseTrace) return null;
    return {
      stage,
      payee: tx.parseTrace.cleanedPayee,
      notes: tx.notes,
    };
  }

  if (stage === "afterStripPII") {
    return {
      stage,
      payee: tx.description,
      notes: tx.notes,
    };
  }

  return {
    stage,
    payee: tx.description,
    notes: tx.notes,
  };
}

/**
 * Determine whether a field value differs from the same field in the previous stage.
 *
 * @param current - Current cell value.
 * @param previous - Previous stage cell value (undefined if first stage).
 * @returns True if the field changed, false otherwise. Never true for first stage.
 */
export function hasChanged(current: string, previous: string | undefined): boolean {
  if (previous === undefined) return false;
  return current !== previous;
}

/**
 * Build the ordered list of stage rows for a given transaction index.
 *
 * Parse sub-stages (raw, afterClean, afterStripPII) are derived from the
 * `parsed` snapshot entry. Other stages use their own snapshot keys.
 *
 * @param snapshots - Pipeline snapshot data.
 * @param index - Transaction index.
 * @returns Array of StageRow objects for present stages, in pipeline order.
 */
export function buildStageRows(snapshots: PipelineSnapshot, index: number): StageRow[] {
  const rows: StageRow[] = [];

  for (const stage of STAGE_ORDER) {
    // Reason: Parse sub-stages derive their data from the `parsed` snapshot,
    // while other stages have their own keys on PipelineSnapshot.
    const isParseSub = stage === "raw" || stage === "afterClean" || stage === "afterStripPII";
    const data = isParseSub ? snapshots.parsed : snapshots[stage];
    if (!data) continue;

    const row = extractRow(stage, data, index);
    if (row) rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Stage label helper
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<StageName, string> = {
  raw: "Raw",
  afterClean: "After Clean",
  afterStripPII: "After StripPII",
  anonymised: "Anonymised",
  sent: "Sent to Gemini",
  categorised: "Categorised",
  restored: "Restored",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Pipeline Inspector component.
 *
 * @param props - See PipelineInspectorProps.
 */
export default function PipelineInspector({
  snapshots,
  selectedIndex,
  categories,
  apiKey,
}: PipelineInspectorProps) {
  // Sandbox state: when populated, overrides the real snapshot for display
  const [sandboxSnapshot, setSandboxSnapshot] = React.useState<PipelineSnapshot | null>(null);
  const [sandboxCategory, setSandboxCategory] = React.useState<string | null>(null);

  /** Handle sandbox execution result. */
  function handleSandboxExecute(result: SandboxResult) {
    setSandboxSnapshot(result.snapshot);
    setSandboxCategory(result.category ?? null);
  }

  /** Clear sandbox data, restoring the real transaction view. */
  function handleSandboxClear() {
    setSandboxSnapshot(null);
    setSandboxCategory(null);
  }

  const isSandboxActive = sandboxSnapshot !== null;

  // Determine which snapshot and index to render
  const activeSnapshot = isSandboxActive ? sandboxSnapshot : snapshots;
  const activeIndex = isSandboxActive ? 0 : selectedIndex;

  const isEmpty = Object.keys(snapshots).length === 0;
  const showPlaceholder = !isSandboxActive && (isEmpty || selectedIndex === null);

  // Build rows from the active snapshot
  const rows = activeIndex !== null ? buildStageRows(activeSnapshot, activeIndex) : [];

  // Determine the display label
  let label: string | null = null;
  if (isSandboxActive) {
    const parsed = activeSnapshot.parsed?.[0];
    label = parsed ? `Sandbox — ${parsed.description}` : "Sandbox";
  } else if (activeIndex !== null) {
    const labelSource = activeSnapshot.restored?.[activeIndex] ?? activeSnapshot.parsed?.[activeIndex];
    const payeeLabel = labelSource
      ? "description" in labelSource
        ? (labelSource as RawTransaction).description
        : (labelSource as GeminiSentEntry).payee
      : "Unknown";
    label = `#${activeIndex + 1} — ${payeeLabel}`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sandbox input — always rendered above the inspector */}
      <SandboxInput
        categories={categories}
        apiKey={apiKey}
        onExecute={handleSandboxExecute}
      />

      {/* Inspector panel */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="flex items-start justify-between border-b bg-muted/50 px-4 py-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pipeline Inspector
            </h3>
            {label && <p className="mt-0.5 text-sm font-medium">{label}</p>}
          </div>
          {isSandboxActive && (
            <Button variant="ghost" size="sm" onClick={handleSandboxClear}>
              Clear
            </Button>
          )}
        </div>

        {/* Placeholder states */}
        {showPlaceholder && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {isEmpty
              ? "Run categorisation to inspect transaction stages."
              : "Click a transaction row to inspect its pipeline journey."}
          </div>
        )}

        {/* Stage diff table */}
        {!showPlaceholder && rows.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Stage</th>
                  {COLUMNS.map((col) => (
                    <th key={col} className="px-3 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const prevRow = rowIdx > 0 ? rows[rowIdx - 1] : undefined;
                  return (
                    <tr key={row.stage} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-foreground">
                        {STAGE_LABELS[row.stage]}
                      </td>
                      {COLUMNS.map((col) => {
                        const value = row[col];
                        const prevValue = prevRow?.[col];
                        const changed = hasChanged(value, prevValue);
                        return (
                          <td
                            key={col}
                            className={cn(
                              "px-3 py-2",
                              changed && "bg-yellow-100/60 dark:bg-yellow-900/30",
                              !value && "text-muted-foreground/50",
                            )}
                          >
                            <span className="flex items-center gap-1">
                              {changed && (
                                <span
                                  className="inline-block size-1.5 shrink-0 rounded-full bg-yellow-500"
                                  title="Changed from previous stage"
                                />
                              )}
                              {value || "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* API Result Panel — shown only for sandbox Full Pipeline runs */}
        {isSandboxActive && sandboxCategory !== null && (
          <div className="border-t bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              API Result
            </p>
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">Category:</span>{" "}
              <span className="font-medium">{sandboxCategory}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
