"use client";

/**
 * CategorisationDebuggerDevTool — dev-only overlay for inspecting Gemini categorisation.
 *
 * Renders a button on the review page that opens a full-screen overlay table.
 * Each row shows the transaction's raw description, Gemini's reasoning, and its
 * final category. Clicking a row expands an annotation section with a text area.
 * A "Download Review" button exports everything as a Markdown file.
 *
 * IMPORTANT: This file must stay within src/dev-tools/ and is only imported
 * when NEXT_PUBLIC_DEV_TOOLS === 'true', ensuring full production exclusion.
 */

import * as React from "react";
import type { RawTransaction } from "@/lib/parsers/types";
import type { DebugData } from "@/lib/categoriser/client";
import {
  buildReviewMarkdown,
  downloadReviewMarkdown,
  extractTransactionPayload,
} from "./export";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CategorisationDebuggerProps {
  transactions: RawTransaction[];
  categoryMap: ReadonlyMap<number, string>;
  debugData: DebugData | null;
}

// ---------------------------------------------------------------------------
// Styles (inline — dev tool lives outside Tailwind component boundaries)
// ---------------------------------------------------------------------------

const S = {
  triggerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid rgba(124,58,237,0.5)",
    background: "rgba(124,58,237,0.12)",
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  } as React.CSSProperties,

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100001,
    display: "flex",
    flexDirection: "column" as const,
    background: "#0f0f19",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#e2e8f0",
    fontSize: 13,
  } as React.CSSProperties,

  overlayHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderBottom: "1px solid rgba(124,58,237,0.2)",
    background:
      "linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.06) 100%)",
    flexShrink: 0,
  } as React.CSSProperties,

  closeBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  } as React.CSSProperties,

  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.08)",
    color: "#4ade80",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    marginLeft: "auto",
  } as React.CSSProperties,

  tableWrap: {
    flex: 1,
    overflow: "auto",
    padding: "0 16px 16px",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginTop: 12,
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    color: "#64748b",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap" as const,
    position: "sticky" as const,
    top: 0,
    background: "#0f0f19",
    zIndex: 1,
  } as React.CSSProperties,

  td: {
    padding: "8px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    verticalAlign: "top" as const,
  } as React.CSSProperties,

  expandedRow: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  } as React.CSSProperties,

  expandedCell: {
    padding: "0 10px 12px 10px",
  } as React.CSSProperties,

  reasoningBlock: {
    background: "rgba(124,58,237,0.08)",
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: 6,
    padding: "8px 10px",
    color: "#c4b5fd",
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 8,
    whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,

  commentLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: 4,
    display: "block",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    minHeight: 72,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#e2e8f0",
    fontSize: 12,
    fontFamily: "inherit",
    padding: "6px 8px",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  devBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(124,58,237,0.25)",
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  noData: {
    color: "#64748b",
    fontStyle: "italic",
    fontSize: 12,
  } as React.CSSProperties,

  pagination: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: 16,
  } as React.CSSProperties,

  pageInfo: {
    fontSize: 12,
    color: "#94a3b8",
    minWidth: 80,
    textAlign: "center" as const,
  } as React.CSSProperties,

  pageBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#e2e8f0",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.1s",
  } as React.CSSProperties,

  pageBtnDisabled: {
    opacity: 0.3,
    cursor: "not-allowed",
  } as React.CSSProperties,
} as const;

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Main component (2.1)
// ---------------------------------------------------------------------------

/**
 * Categorisation Debugger dev tool entry point.
 *
 * Renders a trigger button. When clicked, opens the full-screen overlay.
 *
 * @param props.transactions - Transactions from the review page state.
 * @param props.categoryMap  - Map of index → assigned category.
 * @param props.debugData    - Gemini debug data (rawPayload + perTransaction reasoning).
 */
export default function CategorisationDebuggerDevTool({
  transactions,
  categoryMap,
  debugData,
}: CategorisationDebuggerProps) {
  const [open, setOpen] = React.useState(false);

  // 2.5: Component-level annotation state (index → comment string)
  const [annotations, setAnnotations] = React.useState<Map<number, string>>(
    new Map(),
  );

  const handleAnnotationChange = React.useCallback(
    (index: number, value: string) => {
      setAnnotations((prev) => {
        const next = new Map(prev);
        if (value) {
          next.set(index, value);
        } else {
          next.delete(index);
        }
        return next;
      });
    },
    [],
  );

  // 3.2: Download button handler
  const handleDownload = React.useCallback(() => {
    const md = buildReviewMarkdown(transactions, categoryMap, debugData, annotations);
    downloadReviewMarkdown(md);
  }, [transactions, categoryMap, debugData, annotations]);

  return (
    <>
      {/* Trigger button — rendered inline on the review page */}
      <button
        style={S.triggerBtn}
        onClick={() => setOpen(true)}
        title="Open Categorisation Debugger (dev only)"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(124,58,237,0.22)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(124,58,237,0.12)";
        }}
      >
        🔬 Categorisation Debugger
      </button>

      {/* 2.2: Overlay/modal — rendered only when open */}
      {open && (
        <ReviewOverlay
          transactions={transactions}
          categoryMap={categoryMap}
          debugData={debugData}
          annotations={annotations}
          onAnnotationChange={handleAnnotationChange}
          onDownload={handleDownload}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Overlay container (2.2)
// ---------------------------------------------------------------------------

interface ReviewOverlayProps {
  transactions: RawTransaction[];
  categoryMap: ReadonlyMap<number, string>;
  debugData: DebugData | null;
  annotations: Map<number, string>;
  onAnnotationChange: (index: number, value: string) => void;
  onDownload: () => void;
  onClose: () => void;
}

function ReviewOverlay({
  transactions,
  categoryMap,
  debugData,
  annotations,
  onAnnotationChange,
  onDownload,
  onClose,
}: ReviewOverlayProps) {
  const [currentPage, setCurrentPage] = React.useState(0);

  // Reset to first page when transactions change (e.g. new file uploaded)
  React.useEffect(() => {
    setCurrentPage(0);
  }, [transactions]);

  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginatedTransactions = transactions.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.overlayHeader}>
        <button
          style={S.closeBtn}
          onClick={onClose}
          aria-label="Close categorisation debugger"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#e2e8f0")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#94a3b8")
          }
        >
          ← Close
        </button>

        <span style={S.devBadge}>🛠 DEV</span>

        <span style={{ fontWeight: 600, fontSize: 14 }}>
          Categorisation Debugger
        </span>

        <span style={{ color: "#64748b", fontSize: 12 }}>
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
          {debugData ? " · reasoning available" : " · no debug data"}
        </span>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={S.pagination}>
            <button
              style={{
                ...S.pageBtn,
                ...(currentPage === 0 ? S.pageBtnDisabled : {}),
              }}
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              title="Previous Page"
            >
              ‹
            </button>
            <span style={S.pageInfo}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              style={{
                ...S.pageBtn,
                ...(currentPage >= totalPages - 1 ? S.pageBtnDisabled : {}),
              }}
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              title="Next Page"
            >
              ›
            </button>
          </div>
        )}

        {/* 3.2: Download button */}
        <button
          style={S.downloadBtn}
          onClick={onDownload}
          title="Export review as Markdown"
          onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background =
            "rgba(34,197,94,0.16)")
          }
          onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.background =
            "rgba(34,197,94,0.08)")
          }
        >
          ↓ Download Review
        </button>
      </div>

      {/* 2.3: Data table */}
      <div style={S.tableWrap}>
        <ReviewTable
          transactions={paginatedTransactions}
          pageOffset={currentPage * PAGE_SIZE}
          categoryMap={categoryMap}
          debugData={debugData}
          annotations={annotations}
          onAnnotationChange={onAnnotationChange}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data table (2.3)
// ---------------------------------------------------------------------------

interface ReviewTableProps {
  transactions: RawTransaction[];
  pageOffset: number;
  categoryMap: ReadonlyMap<number, string>;
  debugData: DebugData | null;
  annotations: Map<number, string>;
  onAnnotationChange: (index: number, value: string) => void;
}

function ReviewTable({
  transactions,
  pageOffset,
  categoryMap,
  debugData,
  annotations,
  onAnnotationChange,
}: ReviewTableProps) {
  // 2.4: Track which row is expanded
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const toggleRow = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.th}>#</th>
          <th style={S.th}>Date</th>
          <th style={S.th}>Raw Description</th>
          <th style={S.th}>Amount</th>
          <th style={S.th}>API Payload</th>
          <th style={S.th}>API Output</th>
          <th style={S.th}>Reasoning</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx, i) => {
          const absoluteIndex = pageOffset + i;
          const category = categoryMap.get(absoluteIndex) ?? "—";
          const reasoning =
            debugData?.perTransaction.find((p) => p.index === absoluteIndex)?.reasoning ??
            "";
          const isExpanded = expandedIndex === i;
          const hasAnnotation = !!annotations.get(absoluteIndex);

          const d = tx.date;
          const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

          // Extract row-specific API Payload (exclude valid_categories)
          const parsedPayload = extractTransactionPayload(debugData?.rawPayload, absoluteIndex);

          // Row-specific JSON Output
          const parsedOutput = category !== "—" ? JSON.stringify({ category }, null, 2) : "";

          return (
            <React.Fragment key={absoluteIndex}>
              {/* 2.3: Main data row */}
              <tr
                onClick={() => toggleRow(i)}
                style={{
                  cursor: "pointer",
                  background: isExpanded
                    ? "rgba(124,58,237,0.07)"
                    : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
                title="Click to expand annotations"
              >
                <td style={{ ...S.td, color: "#64748b", width: 32 }}>
                  {absoluteIndex + 1}
                  {hasAnnotation && (
                    <span
                      title="Has annotation"
                      style={{ marginLeft: 4, color: "#fbbf24" }}
                    >
                      ✎
                    </span>
                  )}
                </td>
                <td style={{ ...S.td, whiteSpace: "nowrap" }}>{dateStr}</td>
                <td style={{ ...S.td, minWidth: 200 }}>{tx.originalDescription}</td>
                <td
                  style={{
                    ...S.td,
                    whiteSpace: "nowrap",
                    color: tx.amount < 0 ? "#f87171" : "#4ade80",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {tx.amount < 0 ? "−" : "+"}$
                  {Math.abs(tx.amount).toFixed(2)}
                </td>
                <td style={{ ...S.td, maxWidth: 300 }}>
                  {parsedPayload ? (
                    <pre style={{ margin: 0, fontSize: 11, color: "#94a3b8", whiteSpace: "pre-wrap" }}>
                      {parsedPayload}
                    </pre>
                  ) : (
                    <span style={S.noData}>no payload</span>
                  )}
                </td>
                <td style={{ ...S.td, maxWidth: 150 }}>
                  {parsedOutput ? (
                    <pre style={{ margin: 0, fontSize: 11, color: "#a78bfa", whiteSpace: "pre-wrap" }}>
                      {parsedOutput}
                    </pre>
                  ) : (
                    <span style={{ color: "#a78bfa" }}>{category}</span>
                  )}
                </td>
                <td
                  style={{
                    ...S.td,
                    color: reasoning ? "#94a3b8" : "#334155",
                    fontStyle: reasoning ? "normal" : "italic",
                    maxWidth: 300,
                  }}
                >
                  {reasoning ? (
                    <span style={{ whiteSpace: "pre-wrap" }}>
                      {reasoning}
                    </span>
                  ) : (
                    <span style={S.noData}>no data</span>
                  )}
                </td>
              </tr>

              {/* 2.4: Expandable row for comments */}
              {isExpanded && (
                <tr style={S.expandedRow}>
                  <td colSpan={7} style={S.expandedCell}>
                    <ExpandedRowContent
                      index={absoluteIndex}
                      comment={annotations.get(absoluteIndex) ?? ""}
                      onCommentChange={(v) => onAnnotationChange(absoluteIndex, v)}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Expanded row content (2.4 + 2.5)
// ---------------------------------------------------------------------------

interface ExpandedRowContentProps {
  index: number;
  comment: string;
  onCommentChange: (value: string) => void;
}

function ExpandedRowContent({
  index,
  comment,
  onCommentChange,
}: ExpandedRowContentProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
      {/* 2.5: Annotation text area only */}
      <div>
        <label htmlFor={`annotation-${index}`} style={{ ...S.commentLabel, color: "#e2e8f0" }}>
          Annotation / Notes
        </label>
        <textarea
          id={`annotation-${index}`}
          style={S.textarea}
          placeholder="Add your notes on this categorisation…"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
