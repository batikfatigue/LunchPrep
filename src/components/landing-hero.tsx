"use client";

import { ArrowUpRight, Check, FileText, Sparkles } from "lucide-react";

/** Warm editorial introduction with an illustrative statement preview. */
export function LandingHero() {
  return (
    <section
      aria-labelledby="welcome-title"
      className="mb-2 grid items-center gap-6 xl:grid-cols-[1fr_300px]"
    >
      <div>
        <p className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-primary">
          <span className="size-2 rounded-full bg-sunshine" /> LESS ADMIN. MORE
          LIVING.
        </p>
        <h1
          id="welcome-title"
          tabIndex={-1}
          className="text-[2.25rem] font-semibold leading-[1.15] tracking-[-1.5px] sm:text-[2.8rem]"
        >
          A little prep.
          <br />
          <span className="text-primary">A lot more clarity.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          Turn your bank statements into organised, ready-to-import transactions
          for{" "}
          <a
            href="https://lunchmoney.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline decoration-brand/40 underline-offset-4 hover:text-primary"
          >
            Lunch Money
          </a>
          . Let&apos;s tidy things up.
        </p>
      </div>
      <div
        aria-hidden
        className="relative hidden h-48 items-center justify-center xl:flex"
      >
        <div className="absolute size-44 rounded-full bg-[#e8eee3] dark:bg-accent" />
        <div className="absolute left-6 top-6 h-32 w-36 -rotate-12 rounded-xl border border-[#dddcc6] bg-[#fff9dd] p-4 text-[#827644]">
          <FileText className="size-5" />
          <div className="mt-4 h-1.5 w-20 rounded bg-current/20" />
          <div className="mt-2 h-1.5 w-14 rounded bg-current/20" />
          <div className="mt-2 h-1.5 w-20 rounded bg-current/20" />
        </div>
        <div className="absolute right-4 top-9 w-44 rotate-6 rounded-xl border bg-card p-4 shadow-[0_8px_24px_-12px_#253d3a50]">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-primary">
              <Check className="size-3" />
            </span>{" "}
            All tidied up.
          </div>
          {["Groceries", "Transport", "Dining"].map((category) => (
            <div
              key={category}
              className="mt-2 flex items-center justify-between"
            >
              <span className="text-[10px] text-muted-foreground">
                {category}
              </span>
              <span className="h-1.5 w-9 rounded bg-brand/25" />
            </div>
          ))}
        </div>
        <Sparkles
          className="absolute right-2 top-1 size-7 text-[#bb8800] dark:text-sunshine"
          strokeWidth={1.5}
        />
        <span className="absolute bottom-0 left-20 flex size-9 items-center justify-center rounded-full bg-sunshine text-[#524300]">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
    </section>
  );
}
