"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  FileCheck2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
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
      <h1
        tabIndex={-1}
        className="text-4xl font-bold leading-[1.05] tracking-tight outline-none sm:text-5xl"
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
        <Notice tone="warning" className="mt-5">
          Sample statement with fictional data. Don&apos;t import it into your
          real budget.
        </Notice>
      )}
      <section className="mt-7 overflow-hidden rounded-xl border-2 border-ink bg-card shadow-hard-lg">
        <div className="flex items-center gap-4 border-b-2 border-ink bg-cta/25 p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-cta text-cta-foreground shadow-hard-sm">
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
          <span className="ml-auto hidden rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-semibold sm:block">
            {downloaded ? "Downloaded" : "Prepared"}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-6 border-b-2 border-ink p-6 sm:grid-cols-4">
          {[
            ["Transactions", String(total)],
            ["Categorised", String(categorised)],
            ["To review", String(needsReview)],
            ["Net amount (SGD)", formatCurrency(net)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="tabular mt-2 text-2xl font-semibold">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="p-6">
          {needsReview > 0 ? (
            <Notice tone="warning" className="mb-5">
              <p className="text-sm font-semibold">
                {needsReview} transaction{needsReview === 1 ? "" : "s"} still{" "}
                {needsReview === 1 ? "needs" : "need"} a look.
              </p>
              <p className="mt-1">
                You can export now, or go back to check categories first.
              </p>
              <button
                onClick={onBack}
                className="mt-2 font-semibold underline underline-offset-4"
              >
                Back to review
              </button>
            </Notice>
          ) : (
            <p className="mb-5 flex items-start gap-2 text-xs font-medium text-primary">
              <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} aria-hidden /> Every transaction has a
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
      <section className="mt-6 rounded-xl border-2 border-border bg-card p-6">
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
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline decoration-cta decoration-[3px] underline-offset-4 hover:decoration-foreground"
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
