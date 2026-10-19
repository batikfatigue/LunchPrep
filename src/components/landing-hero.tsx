"use client";

import Image from "next/image";
import { FileCheck2, FileText, ShieldCheck, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Upload your CSV",
    detail: "We clean up the bank's formatting.",
  },
  {
    icon: Sparkles,
    title: "Check the categories",
    detail: "Fix any payee or category in one click.",
  },
  {
    icon: FileCheck2,
    title: "Import to Lunch Money",
    detail: "Download a CSV it understands.",
  },
];

/** Landing promise with the mascot. */
export function LandingHero() {
  return (
    <section aria-labelledby="welcome-title" className="lg:col-start-1">
      <div>
        <h1
          id="welcome-title"
          tabIndex={-1}
          className="text-[2.5rem] font-bold leading-[1.05] tracking-tight outline-none sm:text-5xl xl:text-[3.5rem]"
        >
          A little prep.
          <br />
          <span className="mt-2 inline-block bg-cta px-2 text-cta-foreground [box-decoration-break:clone]">
            A lot more clarity.
          </span>
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <p className="max-w-sm flex-1 text-base leading-relaxed text-muted-foreground">
            Turn DBS statements into clean, categorised transactions for{" "}
            <a
              href="https://lunchmoney.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground underline decoration-cta decoration-[3px] underline-offset-4 hover:decoration-foreground"
            >
              Lunch Money
            </a>
            .
          </p>
          <Image
            src="/icon.png"
            alt=""
            width={160}
            height={160}
            priority
            className="size-24 shrink-0 -rotate-6 object-contain transition-transform duration-300 hover:rotate-3 sm:size-28"
          />
        </div>
      </div>
    </section>
  );
}

/** Three-step outline plus the privacy promise, shown under the form on mobile. */
export function LandingGuide() {
  return (
    <div className="flex flex-col gap-10 lg:col-start-1 lg:self-start">
      <ol className="grid gap-px overflow-hidden rounded-xl border-2 border-ink bg-ink">
        {STEPS.map(({ icon: Icon, title, detail }, index) => (
          <li key={title} className="flex items-center gap-4 bg-card p-4">
            <span className="tabular flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-background text-sm font-semibold">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
            <Icon className="size-4 shrink-0 text-primary" aria-hidden />
          </li>
        ))}
      </ol>

      <div className="flex items-start gap-3 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <p className="leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            Your CSV stays on your device.
          </span>{" "}
          Names and account numbers are masked before any AI request, and your
          review is saved only in this browser.
        </p>
      </div>
    </div>
  );
}
