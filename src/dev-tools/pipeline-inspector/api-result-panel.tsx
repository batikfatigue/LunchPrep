"use client";

/**
 * API Result Panel for the Pipeline Inspector.
 *
 * Shows the Gemini-assigned category, collapsible AI reasoning, and
 * collapsible raw API payload for the selected transaction.
 *
 * Dev-tool only — never imported outside src/dev-tools/.
 */

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ApiResultPanelProps {
  /** Assigned category string. Undefined if categorisation has not run. */
  category: string | undefined;
  /**
   * Gemini reasoning text for this transaction.
   * Undefined means BYOK mode (debug data not available).
   */
  reasoning: string | undefined;
  /**
   * Per-transaction API payload JSON string.
   * Null means no matching payload found.
   * Undefined means BYOK mode (debug data not available).
   */
  rawPayload: string | null | undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * API Result Panel component.
 *
 * Renders a panel with the assigned category and collapsible sections
 * for AI reasoning and raw API payload. Handles BYOK mode gracefully
 * by showing "Not available (BYOK mode)" when debug data is absent.
 *
 * @param props - See ApiResultPanelProps.
 */
export default function ApiResultPanel({ category, reasoning, rawPayload }: ApiResultPanelProps) {
  const [reasoningOpen, setReasoningOpen] = React.useState(true);
  const [payloadOpen, setPayloadOpen] = React.useState(true);

  // Reason: When reasoning is undefined, debug data is unavailable (BYOK mode).
  // Use this as the signal for both reasoning and payload BYOK state.
  const isByok = reasoning === undefined;

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        API Result
      </p>

      {/* Category */}
      <p className="mt-1.5 text-sm">
        <span className="text-muted-foreground">Category: </span>
        <span className="font-medium">{category ?? "—"}</span>
      </p>

      {/* Reasoning (collapsible) */}
      <div className="mt-2">
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setReasoningOpen((v) => !v)}
          type="button"
        >
          {reasoningOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          Reasoning
        </button>
        {reasoningOpen && (
          <div className="mt-1.5 rounded-md border bg-muted/40 px-3 py-2 text-xs">
            {isByok ? (
              <span className="italic text-muted-foreground">Not available (BYOK mode)</span>
            ) : reasoning ? (
              <pre className="whitespace-pre-wrap font-sans">{reasoning}</pre>
            ) : (
              <span className="italic text-muted-foreground">N/A</span>
            )}
          </div>
        )}
      </div>

      {/* API Payload (collapsible) */}
      <div className="mt-2">
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setPayloadOpen((v) => !v)}
          type="button"
        >
          {payloadOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          API Payload
        </button>
        {payloadOpen && (
          <div className="mt-1.5 rounded-md border bg-muted/40 px-3 py-2 text-xs">
            {isByok ? (
              <span className="italic text-muted-foreground">Not available (BYOK mode)</span>
            ) : rawPayload ? (
              <pre className="overflow-auto whitespace-pre font-mono">{rawPayload}</pre>
            ) : (
              <span className="italic text-muted-foreground">N/A</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
