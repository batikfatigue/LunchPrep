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
import type { PipelineSnapshot, GeminiSentEntry } from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineInspectorProps {
  /** Snapshot of transaction state at each pipeline stage. */
  snapshots: PipelineSnapshot;
  /** Index of the selected transaction row (null = no selection). */
  selectedIndex: number | null;
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
type ColumnName = (typeof COLUMNS)[number];

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
}: PipelineInspectorProps) {
  const isEmpty = Object.keys(snapshots).length === 0;

  // Placeholder: no pipeline run yet
  if (isEmpty) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        Pipeline Inspector — Run categorisation to inspect transaction stages.
      </div>
    );
  }

  // Placeholder: no row selected
  if (selectedIndex === null) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        Pipeline Inspector — Click a transaction row to inspect its pipeline journey.
      </div>
    );
  }

  const rows = buildStageRows(snapshots, selectedIndex);

  // Determine the display label: index + payee from restored, falling back to parsed
  const labelSource = snapshots.restored?.[selectedIndex] ?? snapshots.parsed?.[selectedIndex];
  const payeeLabel = labelSource
    ? "description" in labelSource
      ? (labelSource as RawTransaction).description
      : (labelSource as GeminiSentEntry).payee
    : "Unknown";
  const label = `#${selectedIndex + 1} — ${payeeLabel}`;

  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="border-b bg-muted/50 px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pipeline Inspector
        </h3>
        <p className="mt-0.5 text-sm font-medium">{label}</p>
      </div>

      {/* Stage diff table */}
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
    </div>
  );
}
