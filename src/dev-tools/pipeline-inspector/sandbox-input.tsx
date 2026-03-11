"use client";

/**
 * Sandbox input form for testing mock transactions through the pipeline.
 *
 * Allows developers to enter raw DBS CSV fields and execute them through
 * the parsing + anonymisation pipeline (or the full pipeline including
 * Gemini categorisation). Returns a PipelineSnapshot and optional category
 * via callbacks.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { buildCsv } from "@/dev-tools/pipeline-inspector/mock-csv";
import { dbsParser } from "@/lib/parsers/dbs";
import { anonymise, restore } from "@/lib/anonymiser/pii";
import { callCategorise } from "@/lib/categoriser/client";
import type { PipelineSnapshot, GeminiSentEntry } from "@/lib/pipeline-snapshot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result returned by the sandbox after execution. */
export interface SandboxResult {
  /** Pipeline snapshot built from the sandbox transaction. */
  snapshot: PipelineSnapshot;
  /** Gemini-assigned category (only present after Full Pipeline run). */
  category?: string;
}

export interface SandboxInputProps {
  /** Category list for Full Pipeline mode. */
  categories: string[];
  /** Gemini API key for Full Pipeline mode. */
  apiKey: string;
  /** Called when the sandbox executes successfully. */
  onExecute: (result: SandboxResult) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DBS_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a Date as a DBS-style date string (e.g. "10 Mar 2026").
 *
 * @param date - Date to format.
 * @returns DBS-formatted date string.
 */
function formatDbsDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = DBS_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

type RunMode = "parse-anonymise" | "full-pipeline";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Sandbox input form for the pipeline inspector.
 *
 * @param props - See SandboxInputProps.
 */
export default function SandboxInput({
  categories,
  apiKey,
  onExecute,
}: SandboxInputProps) {
  const [code, setCode] = React.useState<string>("ICT");
  const [ref1, setRef1] = React.useState("");
  const [ref2, setRef2] = React.useState("");
  const [ref3, setRef3] = React.useState("");
  const [debit, setDebit] = React.useState("");
  const [credit, setCredit] = React.useState("");
  const [date, setDate] = React.useState(() => formatDbsDate(new Date()));
  const [runMode, setRunMode] = React.useState<RunMode>("parse-anonymise");
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Execute the sandbox transaction through the pipeline.
   * Builds a CSV from form fields, parses it, and runs through stages
   * based on the selected run mode.
   */
  async function handleExecute() {
    setError(null);
    setIsRunning(true);

    try {
      const csv = buildCsv({
        date,
        code,
        ref1: ref1 || undefined,
        ref2: ref2 || undefined,
        ref3: ref3 || undefined,
        debit: debit || undefined,
        credit: credit || undefined,
      });

      const parsed = dbsParser.parse(csv);
      const snapshot: PipelineSnapshot = { parsed };

      const anonymised = anonymise(parsed);
      snapshot.anonymised = anonymised;

      if (runMode === "full-pipeline") {
        // Capture sent stage
        const sentEntries: GeminiSentEntry[] = anonymised.map((tx, i) => ({
          index: i,
          payee: tx.description,
          notes: tx.notes,
          transactionType: tx.transactionCode,
        }));
        snapshot.sent = sentEntries;

        const { results } = await callCategorise(
          anonymised,
          categories,
          apiKey || undefined,
        );

        // Capture categorised stage (before restore)
        snapshot.categorised = anonymised;

        const restored = restore(anonymised);
        snapshot.restored = restored;

        const category = results[0]?.category;
        onExecute({ snapshot, category });
      } else {
        onExecute({ snapshot });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      setError(message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed">
      <div className="border-b bg-muted/50 px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Transaction Sandbox
        </h3>
      </div>

      <div className="px-4 py-3">
        {/* Row 1: Code + Date */}
        <div className="flex gap-3">
          <div className="w-28">
            <label className="mb-1 block text-xs text-muted-foreground">Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 text-sm" placeholder="e.g. ICT" />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs text-muted-foreground">Date</label>
            <Input value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>

        {/* Row 2: Ref fields */}
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ref1</label>
            <Input value={ref1} onChange={(e) => setRef1(e.target.value)} className="h-9 text-sm" placeholder="e.g. PayNow Transfer REF123" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ref2</label>
            <Input value={ref2} onChange={(e) => setRef2(e.target.value)} className="h-9 text-sm" placeholder="e.g. TO: ALICE WONG" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Ref3</label>
            <Input value={ref3} onChange={(e) => setRef3(e.target.value)} className="h-9 text-sm" placeholder="e.g. OTHR lunch money" />
          </div>
        </div>

        {/* Row 3: Amount fields */}
        <div className="mt-2 flex gap-3">
          <div className="w-32">
            <label className="mb-1 block text-xs text-muted-foreground">Debit</label>
            <Input
              value={debit}
              onChange={(e) => setDebit(e.target.value)}
              className="h-9 text-sm"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs text-muted-foreground">Credit</label>
            <Input
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              className="h-9 text-sm"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Row 4: Actions */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isRunning}
            >
              {isRunning ? "Running…" : "Execute"}
            </Button>
            <select
              value={runMode}
              onChange={(e) => setRunMode(e.target.value as RunMode)}
              className={cn(
                "h-8 rounded-md border bg-transparent px-2 text-xs",
                "focus:outline-none focus:ring-2 focus:ring-ring",
              )}
            >
              <option value="parse-anonymise">Parse + Anonymise</option>
              <option value="full-pipeline">Full Pipeline</option>
            </select>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
