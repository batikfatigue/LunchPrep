"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Download,
  FileCheck2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResetImportButton } from "@/components/reset-import-button";
import { formatCurrency } from "@/lib/review/status";

export interface ExportStepProps {
  total: number;
  categorised: number;
  needsReview: number;
  net: number;
  downloaded: boolean;
  isDemo: boolean;
  onDownload: () => void;
  onReset: () => void;
  onBack: () => void;
}

/** Download summary with a reversible review step and explicit import handoff. */
export function ExportStep({
  total,
  categorised,
  needsReview,
  net,
  downloaded,
  isDemo,
  onDownload,
  onReset,
  onBack,
}: ExportStepProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-primary">
        THE FINISHING TOUCH
      </p>
      <h1
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {downloaded
          ? "A little less life admin."
          : "Your next chapter, organised."}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {downloaded
          ? "Your download is ready. Take it over to Lunch Money to finish your import."
          : "One last look, then your transactions are ready to take with you."}
      </p>
      {isDemo && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          Sample statement · Fictional data for exploring LunchPrep. Don&apos;t
          import it into your real budget.
        </p>
      )}
      <section className="mt-7 overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center gap-4 border-b p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <FileCheck2 className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold">
              {isDemo ? "Sample CSV" : "Lunch Money CSV"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Dates, payees, amounts, categories and notes
            </p>
          </div>
          <span className="ml-auto hidden rounded-full bg-accent px-3 py-1 text-xs text-primary sm:block">
            {downloaded ? "Downloaded" : "Prepared"}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-6 border-b p-6 sm:grid-cols-4">
          {[
            ["Transactions", String(total)],
            ["Categorised", String(categorised)],
            ["To review", String(needsReview)],
            ["Net amount (SGD)", formatCurrency(net)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="p-6">
          {needsReview > 0 ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="text-sm">
                <p className="font-medium">
                  {needsReview} transaction{needsReview === 1 ? "" : "s"} still{" "}
                  {needsReview === 1 ? "needs" : "need"} a look.
                </p>
                <p className="mt-1 text-xs leading-5">
                  You can export now, or go back to check categories first.
                </p>
                <button
                  onClick={onBack}
                  className="mt-2 text-xs font-semibold underline underline-offset-4"
                >
                  Back to review
                </button>
              </div>
            </div>
          ) : (
            <p className="mb-5 flex items-center gap-2 text-xs text-primary">
              <Check className="size-4" aria-hidden /> Every transaction has a
              recognised category. Give the details a final check before
              importing.
            </p>
          )}
          <Button size="lg" className="w-full" onClick={onDownload}>
            <Download className="size-4" aria-hidden />
            {downloaded
              ? "Download again"
              : isDemo
                ? "Download sample CSV"
                : "Download Lunch Money CSV"}
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Your reviewed payees, notes, and categories are included in the
            export.
          </p>
        </div>
      </section>
      <section className="mt-6 rounded-2xl border bg-accent/40 p-6">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold">
            A home for your freshly prepared transactions.
          </h2>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          In Lunch Money, use the CSV import option, upload your downloaded
          file, and check the column mappings before confirming.
        </p>
        <a
          href="https://lunchmoney.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Open Lunch Money <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </section>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden /> Back to review
        </Button>
        <ResetImportButton onReset={onReset} />
      </div>
    </div>
  );
}
