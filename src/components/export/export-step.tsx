"use client";

/**
 * Export step: confirmation that the transactions are ready, a summary of
 * what will be exported, a pre-export checklist and the download action.
 */

import * as React from "react";
import {
  Check,
  CircleAlert,
  CircleCheck,
  Download,
  Info,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/review/status";

export interface ExportStepProps {
  /** Total number of transactions in the export. */
  total: number;
  /** Number of confidently categorised transactions. */
  categorised: number;
  /** Number still needing review (low-confidence or uncategorised). */
  needsReview: number;
  /** Net amount across all transactions. */
  net: number;
  /** Whether the CSV has already been downloaded in this session. */
  downloaded: boolean;
  /** Generate and download the Lunch Money CSV. */
  onDownload: () => void;
  /** Clear all state and return to the upload step. */
  onReset: () => void;
}

/**
 * Render the export step.
 *
 * @param props - See ExportStepProps.
 */
export function ExportStep({
  total,
  categorised,
  needsReview,
  net,
  downloaded,
  onDownload,
  onReset,
}: ExportStepProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Success mark */}
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-8" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">
          {downloaded ? "Export complete!" : "You're ready to export!"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {downloaded
            ? "Your Lunch Money CSV has been downloaded. Import it from Settings → Import in Lunch Money."
            : "Your transactions have been processed and are ready for import into Lunch Money."}
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 divide-y rounded-xl border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <StatTile value={String(total)} label="Total transactions" />
        <StatTile
          value={String(categorised)}
          label="Categorised"
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          value={String(needsReview)}
          label="Need review"
          valueClassName={cn(needsReview > 0 && "text-amber-500")}
        />
        <StatTile value={formatCurrency(net)} label="Total (net)" />
      </div>

      {/* Pre-export checklist */}
      <section className="rounded-xl border p-4">
        <h3 className="text-sm font-semibold">Before you export</h3>
        <ul className="mt-3 flex flex-col gap-3">
          <ChecklistItem ok text="All transactions parsed successfully" />
          <ChecklistItem ok text="Names and account numbers anonymised" />
          <ChecklistItem ok text="Categories mapped to Lunch Money format" />
          {needsReview > 0 ? (
            <ChecklistItem
              ok={false}
              text={`${needsReview} transaction${needsReview === 1 ? "" : "s"} need your review`}
              detail="Consider checking these before importing."
            />
          ) : (
            <ChecklistItem ok text="Every transaction has a category" />
          )}
        </ul>
      </section>

      {/* Next steps */}
      <section className="rounded-xl border p-4">
        <h3 className="text-sm font-semibold">What happens next?</h3>
        <ol className="mt-3 flex flex-col gap-3">
          <NextStep
            n={1}
            title="Download your Lunch Money CSV"
            detail="We'll generate a file in the correct format."
          />
          <NextStep
            n={2}
            title="Import into Lunch Money"
            detail="Go to Settings → Import in Lunch Money and upload the file."
          />
          <NextStep
            n={3}
            title="Enjoy!"
            detail="Your transactions will be imported and ready to go."
          />
        </ol>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onDownload}>
          <Download className="size-4" aria-hidden />
          {downloaded ? "Download again" : "Download Lunch Money CSV"}
        </Button>
        <Button size="lg" variant="outline" onClick={onReset}>
          <RefreshCw className="size-4" aria-hidden />
          Start Over
        </Button>
      </div>

      {/* Help */}
      <div className="flex gap-3 rounded-xl border p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-500" aria-hidden />
        <p>
          <span className="font-medium">Need help? </span>
          <span className="text-muted-foreground">
            Check the{" "}
            <a
              href="https://github.com/batikfatigue/LunchPrep#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              README
            </a>{" "}
            or open an issue on GitHub.
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * A single summary tile.
 *
 * @param props.value - Large value text.
 * @param props.label - Caption under the value.
 * @param props.valueClassName - Extra classes for the value.
 */
function StatTile({
  value,
  label,
  valueClassName,
}: {
  value: string;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="px-4 py-3">
      <p className={cn("text-xl font-bold tabular-nums", valueClassName)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * A checklist row with a pass/warn icon.
 *
 * @param props.ok - Whether the check passed.
 * @param props.text - Check description.
 * @param props.detail - Optional supporting line.
 */
function ChecklistItem({
  ok,
  text,
  detail,
}: {
  ok: boolean;
  text: string;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-3 text-sm">
      {ok ? (
        <CircleCheck
          className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
      )}
      <span>
        {text}
        {detail && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
        )}
      </span>
    </li>
  );
}

/**
 * A numbered "what happens next" row.
 *
 * @param props.n - Step number.
 * @param props.title - Step title.
 * @param props.detail - Step description.
 */
function NextStep({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {n}
      </span>
      <span>
        <span className="font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>
      </span>
    </li>
  );
}
