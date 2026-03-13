"use client";

/**
 * Pipeline Inspector — dev tool for inspecting transaction state at each
 * pipeline stage (raw → afterClean → afterStripPII → anonymised → sent →
 * categorised → restored).
 *
 * Renders as an inline detail pane below the transaction table. Composes:
 * - StageDiffTable: per-stage field diff with change markers
 * - ApiResultPanel: category, collapsible reasoning, collapsible API payload
 * - ReviewControls: OK/Flag buttons, note textarea, progress counter, export
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { PipelineSnapshot, GeminiSentEntry } from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";
import type { DebugData } from "@/lib/categoriser/client";
import SandboxInput, { type SandboxResult } from "@/dev-tools/pipeline-inspector/sandbox-input";
import JumpInput from "@/dev-tools/pipeline-inspector/jump-input";
import StageDiffTable, {
  buildStageRows,
} from "@/dev-tools/pipeline-inspector/stage-diff-table";
import ApiResultPanel from "@/dev-tools/pipeline-inspector/api-result-panel";
import ReviewControls, {
  type ReviewStatus,
} from "@/dev-tools/pipeline-inspector/review-controls";
import { extractTransactionPayload, buildReviewMarkdown, downloadReviewMarkdown } from "@/dev-tools/pipeline-inspector/export";
import FlagSummaryOverlay from "@/dev-tools/pipeline-inspector/flag-summary-overlay";
import {
  findNextUnreviewed,
  findPrevUnreviewed,
  findNextFlagged,
  findPrevFlagged,
} from "@/dev-tools/pipeline-inspector/navigation-helpers";

// Re-export pure helpers for backward compatibility with existing tests.
export { extractRow, hasChanged, buildStageRows } from "@/dev-tools/pipeline-inspector/stage-diff-table";

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
  /** Map of transaction index → assigned category (from real categorisation run). */
  categoryMap: ReadonlyMap<number, string>;
  /** Debug data from real categorisation run (null if BYOK or not yet run). */
  debugData: DebugData | null;
  /** Total transaction count for prev/next navigation bounds. */
  transactionCount: number;
  /** Callback to update the selected transaction index from nav buttons. */
  onSelectIndex: (index: number) => void;
}

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
  categoryMap,
  debugData,
  transactionCount,
  onSelectIndex,
}: PipelineInspectorProps) {
  // Sandbox state: when populated, overrides the real snapshot for display
  const [sandboxSnapshot, setSandboxSnapshot] = React.useState<PipelineSnapshot | null>(null);
  const [sandboxCategory, setSandboxCategory] = React.useState<string | null>(null);
  const [sandboxDebugData, setSandboxDebugData] = React.useState<DebugData | null>(null);

  // Review state: ephemeral, cleared on sandbox clear (and should be cleared on snapshot reset)
  const [reviewMap, setReviewMap] = React.useState<Map<number, ReviewStatus>>(new Map());

  // Overlay state
  const [isSummaryOpen, setIsSummaryOpen] = React.useState(false);

  // Reason: Clear review state when the real pipeline snapshots reset (new run).
  // We detect a reset by watching the snapshots reference — when it becomes empty,
  // a new categorisation run has started.
  const prevSnapshotsRef = React.useRef(snapshots);
  React.useEffect(() => {
    if (prevSnapshotsRef.current !== snapshots && Object.keys(snapshots).length === 0) {
      setReviewMap(new Map());
    }
    prevSnapshotsRef.current = snapshots;
  }, [snapshots]);

  /** Handle sandbox execution result. */
  function handleSandboxExecute(result: SandboxResult) {
    setSandboxSnapshot(result.snapshot);
    setSandboxCategory(result.category ?? null);
    setSandboxDebugData(result.debugData ?? null);
  }

  /** Clear sandbox data, restoring the real transaction view. */
  function handleSandboxClear() {
    setSandboxSnapshot(null);
    setSandboxCategory(null);
    setSandboxDebugData(null);
  }

  /** Update review state for a single transaction. Null = clear (unreviewed). */
  function handleReviewChange(index: number, status: ReviewStatus | null) {
    setReviewMap((prev) => {
      const next = new Map(prev);
      if (status === null) {
        next.delete(index);
      } else {
        next.set(index, status);
      }
      return next;
    });
  }

  /** Build and download a Markdown report of all flagged transactions. */
  function handleExport() {
    // Reason: We need the parsed transactions for the export, using the
    // restored stage if available, falling back to parsed.
    const txs = (snapshots.restored ?? snapshots.parsed ?? []) as RawTransaction[];
    const md = buildReviewMarkdown(txs, categoryMap, debugData, reviewMap);
    downloadReviewMarkdown(md);
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

  // Whether to show the real-transaction API Result Panel and Review Controls
  const hasCategory = !isSandboxActive && selectedIndex !== null && categoryMap.has(selectedIndex);
  const showRealApiPanel = hasCategory;
  const showReviewControls = hasCategory;

  // Real transaction API panel data
  const realCategory = selectedIndex !== null ? categoryMap.get(selectedIndex) : undefined;
  const realReasoning =
    debugData?.perTransaction.find((p) => p.index === selectedIndex)?.reasoning;
  const realPayload = selectedIndex !== null
    ? extractTransactionPayload(debugData?.rawPayload, selectedIndex)
    : null;

  // Sandbox API panel data (shown when sandbox Full Pipeline ran)
  const showSandboxApiPanel = isSandboxActive && sandboxCategory !== null;
  const sandboxReasoning = sandboxDebugData?.perTransaction[0]?.reasoning;
  const sandboxPayload = extractTransactionPayload(sandboxDebugData?.rawPayload, 0);

  // Prev/Next navigation
  const canPrev = !isSandboxActive && selectedIndex !== null && selectedIndex > 0;
  const canNext =
    !isSandboxActive && selectedIndex !== null && selectedIndex < transactionCount - 1;

  // Ref for the inspector panel — used to receive focus for keyboard shortcuts.
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Reason: Track the last index set by internal navigation (keyboard A/D shortcuts)
  // so we can skip scrolling for those — the panel is already in view when the user
  // is actively navigating within it.
  const lastInternalIndexRef = React.useRef<number | null>(null);

  // Reason: Scroll the panel into view when an external selection arrives (e.g. the
  // user clicks a row in the transaction table). Skipped for internal keyboard navigation.
  React.useEffect(() => {
    if (
      selectedIndex !== null &&
      selectedIndex !== lastInternalIndexRef.current &&
      !isSandboxActive
    ) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      panelRef.current?.focus({ preventScroll: true });
    }
  }, [selectedIndex, isSandboxActive]);

  /**
   * Keyboard shortcut handler for the inspector panel.
   *
   * Shortcuts (only when not in sandbox mode and a transaction is selected):
   *   ← / →   Navigate to prev/next transaction
   *   O        Toggle OK review status
   *   F        Toggle Flagged review status
   *
   * Ignored when focus is inside an input or textarea (e.g. annotation box).
   */
  function handlePanelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Reason: Don't hijack keyboard input when the user is typing in a form field.
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      setIsSummaryOpen((prev) => !prev);
    }

    if (isSandboxActive || selectedIndex === null) return;

    if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && canPrev) {
      e.preventDefault();
      lastInternalIndexRef.current = selectedIndex - 1;
      onSelectIndex(selectedIndex - 1);
    } else if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && canNext) {
      e.preventDefault();
      lastInternalIndexRef.current = selectedIndex + 1;
      onSelectIndex(selectedIndex + 1);
    } else if (e.key === "o" || e.key === "O") {
      e.preventDefault();
      const current = reviewMap.get(selectedIndex);
      const isOk = current?.status === "ok";
      const note = current?.note ?? "";
      // Reason: Toggle off preserves note as neutral when one exists, otherwise removes entry.
      handleReviewChange(selectedIndex, isOk ? (note ? { status: "neutral", note } : null) : { status: "ok", note });
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      const current = reviewMap.get(selectedIndex);
      const isFlagged = current?.status === "flagged";
      const note = current?.note ?? "";
      // Reason: Toggle off preserves note as neutral when one exists, otherwise removes entry.
      handleReviewChange(selectedIndex, isFlagged ? (note ? { status: "neutral", note } : null) : { status: "flagged", note });
    } else if (e.key === "w" || e.key === "W") {
      e.preventDefault();
      const nextIndex = e.shiftKey
        ? findNextFlagged(selectedIndex, transactionCount, reviewMap)
        : findNextUnreviewed(selectedIndex, transactionCount, reviewMap);
      if (nextIndex !== null) {
        lastInternalIndexRef.current = nextIndex;
        onSelectIndex(nextIndex);
      }
    } else if (e.key === "q" || e.key === "Q") {
      e.preventDefault();
      const prevIndex = e.shiftKey
        ? findPrevFlagged(selectedIndex, transactionCount, reviewMap)
        : findPrevUnreviewed(selectedIndex, transactionCount, reviewMap);
      if (prevIndex !== null) {
        lastInternalIndexRef.current = prevIndex;
        onSelectIndex(prevIndex);
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sandbox input — always rendered above the inspector */}
      <SandboxInput
        categories={categories}
        apiKey={apiKey}
        onExecute={handleSandboxExecute}
      />

      {/* Inspector panel — focusable to enable keyboard shortcuts */}
      <div
        ref={panelRef}
        tabIndex={0}
        className="rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onKeyDown={handlePanelKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b bg-muted/50 px-4 py-2">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pipeline Inspector
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              {label && <p className="text-sm font-medium">{label}</p>}
              <JumpInput
                selectedIndex={selectedIndex}
                transactionCount={transactionCount}
                isSandboxActive={isSandboxActive}
                onJump={onSelectIndex}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Keyboard hint */}
            {!isSandboxActive && (
              <span className="text-[10px] text-muted-foreground/60 select-none">
                Q ‹ unrev · W unrev › · ⇧Q ‹ flag · ⇧W flag › · A ‹ prev · D next › · O ok · F flag · S summary
              </span>
            )}

            {isSandboxActive && (
              <Button variant="ghost" size="sm" onClick={handleSandboxClear}>
                Clear
              </Button>
            )}
          </div>
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
        {!showPlaceholder && rows.length > 0 && <StageDiffTable rows={rows} />}

        {/* API Result Panel — real transaction (shown when categoryMap has data) */}
        {showRealApiPanel && (
          <ApiResultPanel
            category={realCategory}
            reasoning={realReasoning}
            rawPayload={realPayload}
          />
        )}

        {/* API Result Panel — sandbox Full Pipeline */}
        {showSandboxApiPanel && (
          <ApiResultPanel
            category={sandboxCategory ?? undefined}
            reasoning={sandboxReasoning}
            rawPayload={sandboxPayload}
          />
        )}

        {/* Review Controls — shown only for real transactions after categorisation */}
        {showReviewControls && selectedIndex !== null && (
          <ReviewControls
            selectedIndex={selectedIndex}
            reviewMap={reviewMap}
            totalCount={transactionCount}
            onReviewChange={handleReviewChange}
            onExport={handleExport}
            onExitAnnotation={() => panelRef.current?.focus()}
          />
        )}
      </div>

      {/* Overlays */}
      <FlagSummaryOverlay
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        reviewMap={reviewMap}
        snapshots={snapshots}
        onSelect={onSelectIndex}
      />
    </div>
  );
}
