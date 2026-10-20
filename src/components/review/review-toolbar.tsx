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

/**
 * Review step heading, stats row, filter chips and search field.
 *
 * @param {ReviewToolbarProps} props - Counts, filter, query and their setters.
 * @returns {JSX.Element} The toolbar block above the table.
 */
export function ReviewToolbar({
  counts,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  searchRef,
}: ReviewToolbarProps) {
  const stats = [
    { label: "Transactions", value: counts.all },
    { label: "Categorised", value: counts.categorised },
    { label: "To review", value: counts["needs-review"] + counts.uncategorised },
  ];
  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h1 tabIndex={-1} className="statement outline-none">
            The details, made <em>clear.</em>
          </h1>
          <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
            Check your transactions, fine-tune the categories, and make them
            yours. Click any payee, note or category to edit it.
          </p>
        </div>
        <dl className="grid grid-cols-3 lg:col-span-5">
          {stats.map(({ label, value }, i) => (
            <div
              key={label}
              className={cn("border-l pl-4 sm:pl-6", i === 0 && "border-l-0 pl-0 sm:pl-0")}
            >
              <dd className="numeral">{value}</dd>
              <dt className="label mt-3">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
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
                  "inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors duration-200",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {chip.label}
                <span className="tabular opacity-70">{counts[chip.id]}</span>
              </button>
            );
          })}
        </div>

        <div className="relative xl:w-80">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search payee, description, or amount…"
            aria-label="Search transactions"
            className="h-10 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground"
          />
        </div>
      </div>
    </div>
  );
}
