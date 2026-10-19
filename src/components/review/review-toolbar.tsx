"use client";

/**
 * Header controls for the review step: title, transaction counts, status
 * filter chips and the search box.
 */

import * as React from "react";
import { CheckCircle2, CircleDashed, ListFilter, Search } from "lucide-react";

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

/** Chip treatment when active. */
// Reason: one active treatment for every chip keeps the filter row quiet;
// the counts carry the meaning, not a rainbow of colours.
const ACTIVE_CHIP = "border-ink bg-cta text-cta-foreground shadow-hard-sm";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1
          tabIndex={-1}
          className="text-4xl font-bold leading-[1.05] tracking-tight outline-none sm:text-5xl"
        >
          The details, made clear.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Check your transactions, fine-tune the categories, and make them
          yours.
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Transactions", value: counts.all, icon: ListFilter },
          {
            label: "Categorised",
            value: counts.categorised,
            icon: CheckCircle2,
          },
          {
            label: "To review",
            value: counts["needs-review"] + counts.uncategorised,
            icon: CircleDashed,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border-2 border-ink bg-card p-3 shadow-hard-sm sm:p-5"
          >
            <dt className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground sm:text-xs">
              {label}
              <Icon
                className="hidden size-4 text-primary sm:block"
                aria-hidden
              />
            </dt>
            <dd className="tabular mt-2 text-3xl font-semibold">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-center">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter transactions"
        >
          {CHIPS.map((chip) => {
            const isActive = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFilterChange(chip.id)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-[background-color,box-shadow]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? ACTIVE_CHIP
                    : "border-border bg-card text-muted-foreground hover:border-ink hover:text-foreground",
                )}
              >
                {chip.label}
                <span className="tabular opacity-70">
                  {counts[chip.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative 2xl:w-72">
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
              "h-10 w-full rounded-md border-2 border-input bg-card pl-9 pr-3 text-sm outline-none",
              "placeholder:text-muted-foreground focus-visible:border-ink focus-visible:shadow-hard-sm",
            )}
          />
        </div>
      </div>
    </div>
  );
}
