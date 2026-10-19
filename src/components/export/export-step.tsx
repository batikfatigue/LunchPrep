"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
} from "lucide-react";
import { CsvPreview } from "@/components/brand/csv-preview";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ResetImportButton } from "@/components/reset-import-button";
import { cn } from "@/lib/utils";
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

/**
 * Download summary with a reversible review step and explicit import handoff.
 * Asymmetric: the statement, numerals and download on the left, the Lunch
 * Money handoff on the right.
 *
 * @param {ExportStepProps} props - Summary counts and step callbacks.
 * @returns {JSX.Element} The export step.
 */
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
  const stats = [
    ["Transactions", String(total)],
    ["Categorised", String(categorised)],
    ["To review", String(needsReview)],
    ["Net amount (SGD)", formatCurrency(net)],
  ];
  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-x-16">
      <div className="lg:col-span-7">
        <p className="label flex items-center gap-3 border-b pb-4">
          <span>Export</span>
          <span className="ml-auto">
            {isDemo ? "Sample CSV" : "Lunch Money CSV"}
          </span>
          <span>{downloaded ? "Downloaded" : "Prepared"}</span>
        </p>
        <h1 tabIndex={-1} className="statement mt-12 !text-[clamp(2.5rem,6.2vw,5.75rem)] !leading-[0.98] outline-none">
          {downloaded ? (
            <>
              A little less <em>life admin.</em>
            </>
          ) : (
            <>
              Ready when <em>you are.</em>
            </>
          )}
        </h1>
        <p className="mt-8 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
          {downloaded
            ? "Your download is ready. Take it over to Lunch Money to finish your import."
            : "One last look, then your transactions are ready to take with you."}
        </p>
        {isDemo && (
          <Notice tone="warning" className="mt-8">
            Sample statement with fictional data. Don&apos;t import it into your
            real budget.
          </Notice>
        )}
        <dl className="mt-14 grid grid-cols-2 gap-y-12 border-t pt-10">
          {stats.map(([label, value], i) => (
            <div
              key={label}
              className={cn(
                "min-w-0",
                i === 1 && "border-l pl-6",
                i === 3 && "border-l pl-6",
              )}
            >
              <dd className="numeral !text-[clamp(1.75rem,3.4vw,2.75rem)]">
                {value}
              </dd>
              <dt className="label mt-3">{label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-14">
          {needsReview > 0 ? (
            <Notice tone="warning" className="mb-8">
              <div>
                <p className="font-medium">
                  {needsReview} transaction{needsReview === 1 ? "" : "s"} still{" "}
                  {needsReview === 1 ? "needs" : "need"} a look.
                </p>
                <p className="mt-1 text-muted-foreground">
                  You can export now, or go back to check categories first.
                </p>
                <button
                  onClick={onBack}
                  className="link-quiet mt-3 inline-flex items-center gap-1"
                >
                  Back to review
                </button>
              </div>
            </Notice>
          ) : (
            <p className="mb-8 flex items-start gap-2 text-sm text-muted-foreground">
              <Check
                className="mt-0.5 size-4 shrink-0 text-foreground"
                strokeWidth={2.5}
                aria-hidden
              />
              Every transaction has a recognised category. Give the details a
              final check before importing.
            </p>
          )}
          <Button size="lg" className="w-full sm:w-auto" onClick={onDownload}>
            <Download className="size-4" aria-hidden />
            {downloaded
              ? "Download again"
              : isDemo
                ? "Download sample CSV"
                : "Download Lunch Money CSV"}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Your reviewed payees, notes, and categories are included in the
            export.
          </p>
        </div>
      </div>

      <aside
        aria-labelledby="next-title"
        className="min-w-0 lg:col-span-5 lg:col-start-8"
      >
        <CsvPreview />
        <p className="label border-b pb-4">Next</p>
        <h2 id="next-title" className="statement mt-8 !text-[clamp(1.75rem,2.6vw,2.25rem)]">
          A home for your freshly prepared transactions.
        </h2>
        <p className="mt-5 max-w-[44ch] text-sm leading-6 text-muted-foreground">
          In Lunch Money, use the CSV import option, upload your downloaded
          file, and check the column mappings before confirming.
        </p>
        <a
          href="https://lunchmoney.app"
          target="_blank"
          rel="noopener noreferrer"
          className="link-quiet mt-6 inline-flex items-center gap-1 text-sm"
        >
          Open Lunch Money <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden /> Back to review
          </Button>
          <ResetImportButton onReset={onReset} />
        </div>
      </aside>
    </div>
  );
}
