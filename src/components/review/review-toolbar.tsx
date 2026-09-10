"use client";

/**
 * Header controls for the review step: title, transaction counts, status
 * filter chips and the search box.
 */

import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ReviewFilter, StatusCounts } from "@/lib/review/status";

export interface ReviewToolbarProps {
  /** Counts per review status, used for the summary line and chips. */
  counts: StatusCounts;
  /** Active filter chip. */
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  /** Current search query. */
  query: string;
  onQueryChange: (query: string) => void;
  /** Ref attached to the search input so `/` can focus it from the table. */
  searchRef?: React.Ref<HTMLInputElement>;
}

const CHIPS: Array<{ id: ReviewFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "categorised", label: "Categorised" },
  { id: "needs-review", label: "Needs Review" },
  { id: "uncategorised", label: "Uncategorised" },
];

/** Chip colouring per filter when active. */
const ACTIVE_CHIP: Record<ReviewFilter, string> = {
  all: "border-foreground/15 bg-foreground/10 text-foreground",
  categorised:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  "needs-review":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  uncategorised: "border-border bg-muted text-foreground",
};

/**
 * Review step heading, filter chips and search field.
 *
 * @param props - See ReviewToolbarProps.
 */
export function ReviewToolbar({
  counts,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  searchRef,
}: ReviewToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Review your transactions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check and edit the AI-categorised transactions before exporting.
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">
            {counts.all} transaction{counts.all === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">
            {counts.categorised} categorised &middot;{" "}
            {counts["needs-review"] + counts.uncategorised} to review
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter transactions">
        {CHIPS.map((chip) => {
          const isActive = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(chip.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? ACTIVE_CHIP[chip.id]
                  : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {chip.label}
              <span className="tabular-nums opacity-70">{counts[chip.id]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search payee, description, or amount…"
          aria-label="Search transactions"
          className={cn(
            "h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          )}
        />
      </div>
    </div>
  );
}
