"use client";

import { ArrowDown, Check } from "lucide-react";
import { PrepSheet } from "@/components/brand/prep-sheet";
import { ScrollLink } from "@/components/scroll-link";

const STEPS = [
  {
    title: "Upload your CSV",
    detail: "We tidy the bank's formatting and read it in this browser.",
    fragment: (
      <p className="tabular flex w-full items-center justify-between gap-3">
        <span className="truncate">statement-feb.csv</span>
        <span className="label whitespace-nowrap">stays here</span>
      </p>
    ),
  },
  {
    title: "Check the categories",
    detail: "Fix any payee, note or category in a click.",
    fragment: (
      <p className="flex w-full items-center justify-between gap-3">
        <span className="text-sm">Noodle House Stall</span>
        <span className="marker inline-flex items-center gap-1 rounded-full px-2.5">
          <Check className="size-3" strokeWidth={2.5} aria-hidden />
          Dining
        </span>
      </p>
    ),
  },
  {
    title: "Import to Lunch Money",
    detail: "Download a CSV that Lunch Money understands.",
    fragment: (
      <p className="tabular w-full truncate">
        <span className="marker">date,payee,amount,category,notes</span>
      </p>
    ),
  },
];

/**
 * Landing promise: micro label on a hairline, an oversized statement, one plain
 * sentence, then the prep sheet showing what the product actually does.
 */
export function LandingHero() {
  return (
    <section
      aria-labelledby="welcome-title"
      className="flex flex-col gap-[clamp(48px,6vw,88px)]"
    >
      <div>
        <p className="label rise flex items-center gap-3 border-b pb-4">
          <span>For DBS and POSB statements</span>
          <span className="ml-auto">Independent companion for Lunch Money</span>
        </p>
        <h1
          id="welcome-title"
          tabIndex={-1}
          className="display rise mt-[clamp(40px,6vw,88px)] outline-none"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Prep your bank CSV
          <br />
          for <em>Lunch&nbsp;Money.</em>
        </h1>
        <div
          className="rise mt-[clamp(32px,4vw,56px)] grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <p className="max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            Turn a bank CSV into clean, categorised transactions, without
            connecting your bank. Your file stays in this browser.
          </p>
          <ScrollLink
            href="#import"
            focusId="upload-title"
            className="group inline-flex h-12 items-center gap-2 justify-self-start rounded-full bg-primary px-7 text-[0.9375rem] font-medium text-primary-foreground transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] sm:justify-self-end"
          >
            Import a statement
            <ArrowDown
              className="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
              aria-hidden
            />
          </ScrollLink>
        </div>
      </div>
      <PrepSheet />
    </section>
  );
}

/** Three stations: each step carries a small real fragment of what happens. */
export function LandingGuide() {
  return (
    <section aria-labelledby="how-title" className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-12">
      <h2 id="how-title" className="statement lg:col-span-6">
        Three steps, <em>no bank login.</em>
      </h2>
      <ol className="grid gap-x-12 gap-y-10 lg:col-span-12 lg:grid-cols-3">
        {STEPS.map(({ title, detail, fragment }) => (
          <li key={title} className="border-t pt-6">
            <div
              aria-hidden
              className="mb-6 flex min-h-20 items-center rounded-lg border bg-card px-5 py-4 text-xs"
            >
              {fragment}
            </div>
            <p className="text-xl tracking-[-0.02em]">{title}</p>
            <p className="mt-2 max-w-[32ch] text-sm leading-6 text-muted-foreground">
              {detail}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
