"use client";

/**
 * Review controls for the Pipeline Inspector.
 *
 * Renders OK/Flag buttons, a note textarea (when flagged), a progress
 * counter, and an export button for the active transaction review workflow.
 *
 * Dev-tool only — never imported outside src/dev-tools/.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types — exported for use in export.ts and index.tsx
// ---------------------------------------------------------------------------

/**
 * Per-transaction review state.
 *
 * - Absent from the map: unreviewed (no note).
 * - "neutral": toggled off after a note was written — note preserved but no status.
 * - "ok" / "flagged": active review status.
 */
export type ReviewStatus = {
  status: "ok" | "flagged" | "neutral";
  note: string;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReviewControlsProps {
  /** Currently selected transaction index. */
  selectedIndex: number;
  /** Map of transaction index → ReviewStatus (absent = unreviewed). */
  reviewMap: ReadonlyMap<number, ReviewStatus>;
  /** Total transaction count for the progress counter. */
  totalCount: number;
  /** Called when the user changes the review state for the selected transaction. */
  onReviewChange: (index: number, status: ReviewStatus | null) => void;
  /** Called when the user clicks the Export button. */
  onExport: () => void;
  /**
   * Called when the user presses Enter (without Shift) in the annotation textarea,
   * signalling intent to exit the textarea and return focus to the inspector panel.
   */
  onExitAnnotation?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Review controls section for the pipeline inspector.
 *
 * Renders OK/Flag buttons for the selected transaction, shows a note
 * textarea when flagged, displays a reviewed/total progress counter,
 * and provides an Export button for downloading the flagged items report.
 *
 * @param props - See ReviewControlsProps.
 */
export default function ReviewControls({
  selectedIndex,
  reviewMap,
  totalCount,
  onReviewChange,
  onExport,
  onExitAnnotation,
}: ReviewControlsProps) {
  const currentStatus = reviewMap.get(selectedIndex);
  const isOk = currentStatus?.status === "ok";
  const isFlagged = currentStatus?.status === "flagged";
  const note = currentStatus?.note ?? "";

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Reason: Auto-focus only when the current transaction transitions to flagged
  // (e.g. clicking Flag or pressing F). Navigating to an already-flagged
  // transaction must not steal focus — guarded by checking the index is unchanged.
  const prevRef = React.useRef({ index: selectedIndex, isFlagged });
  React.useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { index: selectedIndex, isFlagged };
    if (isFlagged && !prev.isFlagged && prev.index === selectedIndex) {
      textareaRef.current?.focus();
    }
  }, [isFlagged, selectedIndex]);

  // Reason: Only "ok" and "flagged" count toward reviewed progress — "neutral"
  // means the user toggled off a status (but may have left a note) and has not
  // actively reviewed the transaction.
  const okCount = Array.from(reviewMap.values()).filter((s) => s.status === "ok").length;
  const flaggedCount = Array.from(reviewMap.values()).filter((s) => s.status === "flagged").length;
  const reviewedCount = okCount + flaggedCount;

  function handleOk() {
    const note = currentStatus?.note ?? "";
    if (isOk) {
      // Reason: Toggle off — preserve note as neutral if one exists, otherwise
      // fully remove the entry so the transaction returns to unreviewed.
      onReviewChange(selectedIndex, note ? { status: "neutral", note } : null);
    } else {
      onReviewChange(selectedIndex, { status: "ok", note });
    }
  }

  function handleFlag() {
    const note = currentStatus?.note ?? "";
    if (isFlagged) {
      // Reason: Toggle off — preserve note as neutral if one exists, otherwise
      // fully remove the entry so the transaction returns to unreviewed.
      onReviewChange(selectedIndex, note ? { status: "neutral", note } : null);
    } else {
      onReviewChange(selectedIndex, { status: "flagged", note });
    }
  }

  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    // Reason: Textarea is only enabled when flagged, so status is always "flagged" here.
    onReviewChange(selectedIndex, { status: "flagged", note: e.target.value });
  }

  return (
    <div className="border-t bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Review
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{reviewedCount}/{totalCount} reviewed</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-green-600 dark:text-green-500">{okCount} ok</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-amber-500">{flaggedCount} flagged</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {/* OK button */}
        <Button
          size="sm"
          variant={isOk ? "default" : "outline"}
          className={cn(
            "h-7 px-3 text-xs",
            isOk && "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600",
          )}
          onClick={handleOk}
        >
          OK
        </Button>

        {/* Flag button */}
        <Button
          size="sm"
          variant={isFlagged ? "default" : "outline"}
          className={cn(
            "h-7 px-3 text-xs",
            isFlagged &&
              "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
          )}
          onClick={handleFlag}
        >
          Flag
        </Button>

        {/* Export button */}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 px-3 text-xs"
          onClick={onExport}
        >
          Export flagged
        </Button>
      </div>

      {/* Note textarea — editable only when flagged, greyed out otherwise */}
      <textarea
        ref={textareaRef}
        className={cn(
          "mt-2 w-full rounded-md border px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          isFlagged ? "bg-background" : "bg-muted text-muted-foreground cursor-not-allowed",
        )}
        rows={3}
        placeholder="Add a note about this transaction… (Enter to return to inspector)"
        value={note}
        disabled={!isFlagged}
        onChange={handleNoteChange}
        onKeyDown={(e) => {
          // Reason: Enter without Shift exits the textarea back to the inspector
          // so the user can immediately use arrow-key navigation.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onExitAnnotation?.();
          }
        }}
      />
    </div>
  );
}
