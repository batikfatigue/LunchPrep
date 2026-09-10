"use client";

/**
 * Numbered pagination control for the review table.
 *
 * Shows every page when there are few, and collapses the middle with ellipses
 * once the count grows so the control keeps a fixed footprint.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ReviewPaginationProps {
  /** Current 0-indexed page. */
  page: number;
  /** Total number of pages (>= 1). */
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Build the list of page numbers (0-indexed) and ellipsis markers to render.
 *
 * @param page - Current 0-indexed page.
 * @param totalPages - Total page count.
 * @param maxSlots - Maximum number of page buttons to show.
 * @returns Page indices, with `"…"` where pages are skipped.
 */
export function buildPageItems(
  page: number,
  totalPages: number,
  maxSlots = 5,
): Array<number | "…"> {
  if (totalPages <= maxSlots) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const items: Array<number | "…"> = [0];
  const window = Math.floor((maxSlots - 3) / 2);
  let start = Math.max(1, page - window);
  let end = Math.min(totalPages - 2, page + window);

  // Reason: keep a constant number of buttons when the window hits either edge.
  const span = maxSlots - 3;
  if (end - start + 1 < span) {
    if (start === 1) end = Math.min(totalPages - 2, start + span - 1);
    else start = Math.max(1, end - span + 1);
  }

  if (start > 1) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 2) items.push("…");
  items.push(totalPages - 1);

  return items;
}

/**
 * Previous/next arrows around numbered page buttons.
 *
 * @param props - See ReviewPaginationProps.
 */
export function ReviewPagination({ page, totalPages, onPageChange }: ReviewPaginationProps) {
  const items = buildPageItems(page, totalPages);

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <ArrowButton
        label="Previous page"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </ArrowButton>

      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item + 1}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              "size-7 rounded-md text-sm tabular-nums transition-colors",
              item === page
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {item + 1}
          </button>
        ),
      )}

      <ArrowButton
        label="Next page"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </ArrowButton>
    </nav>
  );
}

/**
 * Circular previous/next button.
 *
 * @param props.label - Accessible label.
 * @param props.disabled - Whether navigation in this direction is possible.
 * @param props.onClick - Navigation handler.
 * @param props.children - Chevron icon.
 */
function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
