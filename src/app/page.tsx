"use client";

/**
 * LunchPrep main page — Upload → Review → Export wizard.
 *
 * Orchestrates the full pipeline:
 * 1. Upload step: file drag-and-drop, CSV format, privacy note, AI mode.
 * 2. Review step: transaction table with AI-generated categories and inline editing.
 * 3. Export step: summary, pre-export checklist and CSV download.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { ArrowRight, FileText, RefreshCw, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ExportStep } from "@/components/export/export-step";
import { UploadStep } from "@/components/upload/upload-step";
import { type PipelineStep } from "@/components/pipeline-steps";
import {
  TransactionTable,
  computeSummary,
  type CategorisationStatus,
} from "@/components/transaction-table";
import { Button } from "@/components/ui/button";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSessionPersistence } from "@/hooks/use-session-persistence";

import { detectAndParse } from "@/lib/parsers/registry";
import { anonymise, restore } from "@/lib/anonymiser/pii";
import { callCategorise } from "@/lib/categoriser/client";
import type { DebugData } from "@/lib/categoriser/client";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import { generateLunchMoneyCsv, downloadCsv } from "@/lib/exporter/lunchmoney";
import { countByStatus } from "@/lib/review/status";
import type { RawTransaction } from "@/lib/parsers/types";
import type { PipelineSnapshot, GeminiSentEntry } from "@/lib/pipeline-snapshot"; // Dev-tools: pipeline-inspector

// ---------------------------------------------------------------------------
// Dev-only import: conditionally loaded, dead-code eliminated in production
// ---------------------------------------------------------------------------

// Dev-tools: pipeline-inspector — gated dynamic import (Pattern B)
// Reason: The ternary is evaluated at build time by Next.js, so the entire
// import is stripped in production when NEXT_PUBLIC_DEV_TOOLS is unset.
const PipelineInspectorDevTool =
  process.env.NEXT_PUBLIC_DEV_TOOLS === "true"
    ? dynamic(() => import("@/dev-tools/pipeline-inspector"))
    : null;

// ---------------------------------------------------------------------------
// Page component (default export required by Next.js)
// ---------------------------------------------------------------------------

/**
 * Main LunchPrep wizard page.
 *
 * @returns The full wizard UI as a React element.
 */
export default function Home() {
  // ---------------------------------------------------------------------------
  // Persisted state (survives page refresh via localStorage)
  // ---------------------------------------------------------------------------

  const [categories, setCategories] = useLocalStorage<string[]>(
    "lunchprep_categories",
    DEFAULT_CATEGORIES,
  );
  const [apiKey, setApiKey] = useLocalStorage<string>("lunchprep_gemini_key", "");

  // ---------------------------------------------------------------------------
  // Ephemeral state (resets on page refresh)
  // ---------------------------------------------------------------------------

  const [step, setStep] = React.useState<PipelineStep>("upload");
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [transactions, setTransactions] = React.useState<RawTransaction[]>([]);
  const [categoryMap, setCategoryMap] = React.useState<Map<number, string>>(
    new Map(),
  );
  // Dev-tools: pipeline-inspector — immutable snapshot of AI-assigned categories at categorisation time.
  // Reason: Keeps the API Result Panel showing the original AI output even after user edits categoryMap.
  const [apiCategoryMap, setApiCategoryMap] = React.useState<ReadonlyMap<number, string>>(new Map());
  const [catStatus, setCatStatus] = React.useState<CategorisationStatus>("idle");
  const [parseError, setParseError] = React.useState<string | null>(null);
  // Dev-mode only: debug data from the categorisation API (reasoning + raw payload).
  // Stays null in production since the API never returns debug data there.
  const [debugData, setDebugData] = React.useState<DebugData | null>(null);
  // Original CSV filename — captured on upload, used in session metadata.
  const [csvFilename, setCsvFilename] = React.useState<string>("");
  // Whether the Lunch Money CSV has been downloaded in this session.
  const [downloaded, setDownloaded] = React.useState(false);
  // Dev-tools: pipeline-inspector — snapshot of transaction state at each pipeline stage
  const [snapshots, setSnapshots] = React.useState<PipelineSnapshot>({});
  // Dev-tools: pipeline-inspector — index of the selected transaction row
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Session persistence
  // ---------------------------------------------------------------------------

  // Reason: Only pass state to the hook when catStatus is "done" so we never
  // persist a partial or loading state. The hook handles the debounce internally.
  const { savedSession, restore: restoreSession, discard } = useSessionPersistence(
    catStatus === "done"
      ? { filename: csvFilename, transactions, categoryMap, catStatus }
      : null,
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Remember the chosen CSV. Parsing is deferred until the user continues.
   *
   * @param file - The CSV File selected by the user.
   */
  function handleFileSelect(file: File) {
    setParseError(null);
    setPendingFile(file);
    setCsvFilename(file.name);
  }

  /**
   * Parse the pending CSV, move to the review step and kick off categorisation.
   */
  async function handleContinueToReview() {
    if (!pendingFile) return;
    setParseError(null);
    setIsParsing(true);
    try {
      const text = await pendingFile.text();
      const txs = detectAndParse(text);
      setTransactions(txs);
      setCategoryMap(new Map());
      setApiCategoryMap(new Map());
      setStep("review");
      // Auto-trigger categorisation immediately after parse.
      void triggerCategorise(txs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse the file.";
      setParseError(message);
    } finally {
      setIsParsing(false);
    }
  }

  /**
   * Run the full AI categorisation pipeline:
   * anonymise → callCategorise → restore → populate categoryMap.
   *
   * @param txs - Transactions to categorise. Defaults to current state.
   */
  async function triggerCategorise(txs: RawTransaction[] = transactions) {
    setCatStatus("loading");
    setSnapshots({}); // Dev-tools: pipeline-inspector — reset snapshot for new run
    try {
      // Dev-tools: pipeline-inspector — capture parsed stage
      setSnapshots((prev) => ({ ...prev, parsed: txs }));

      const anonymised = anonymise(txs);
      // Dev-tools: pipeline-inspector — capture anonymised stage
      setSnapshots((prev) => ({ ...prev, anonymised }));

      // Dev-tools: pipeline-inspector — capture sent stage (Gemini payload shape)
      // Gated to avoid unnecessary work in production.
      if (process.env.NEXT_PUBLIC_DEV_TOOLS === "true") {
        const sentEntries: GeminiSentEntry[] = anonymised.map((tx, i) => ({
          index: i,
          payee: tx.description,
          notes: tx.notes,
          transactionType: tx.transactionCode,
        }));
        setSnapshots((prev) => ({ ...prev, sent: sentEntries }));
      }

      // Reason: Pass apiKey only when non-empty; callCategorise() will fall
      // back to reading from localStorage via getBYOKKey() when undefined.
      const { results, debug } = await callCategorise(
        anonymised,
        categories,
        apiKey || undefined,
      );
      // Dev-tools: pipeline-inspector — capture categorised stage (before restore)
      setSnapshots((prev) => ({ ...prev, categorised: anonymised }));

      const restored = restore(anonymised);
      // Dev-tools: pipeline-inspector — capture restored stage
      setSnapshots((prev) => ({ ...prev, restored }));

      setTransactions(restored);
      if (debug) setDebugData(debug);

      const map = new Map<number, string>();
      for (const r of results) {
        map.set(r.index, r.category);
      }
      setCategoryMap(map);
      setApiCategoryMap(new Map(map)); // immutable snapshot of the original AI result
      setCatStatus("done");
    } catch {
      // Reason: Keep status as "error" so the error banner is shown.
      // The user can still assign categories manually.
      setCatStatus("error");
    }
  }

  /**
   * Generate and download the Lunch Money CSV.
   */
  function handleDownload() {
    const csv = generateLunchMoneyCsv(transactions, categoryMap);
    downloadCsv(csv);
    setDownloaded(true);
    // Reason: Clear session on export — workflow is complete, no need to resume.
    discard();
  }

  /**
   * Reset all ephemeral state and return to the upload step.
   */
  function handleReset() {
    setTransactions([]);
    setCategoryMap(new Map());
    setApiCategoryMap(new Map());
    setCatStatus("idle");
    setParseError(null);
    setDebugData(null);
    setCsvFilename("");
    setPendingFile(null);
    setDownloaded(false);
    setSnapshots({}); // Dev-tools: pipeline-inspector
    setSelectedIndex(null); // Dev-tools: pipeline-inspector
    // Reason: Clear session on reset — user is starting over.
    discard();
    setStep("upload");
  }

  /**
   * Update a transaction's payee description in state.
   *
   * @param index - 0-based transaction index.
   * @param payee - New payee string.
   */
  function handlePayeeChange(index: number, payee: string) {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, description: payee } : tx)),
    );
  }

  /**
   * Update a transaction's notes in state.
   *
   * @param index - 0-based transaction index.
   * @param notes - New notes string.
   */
  function handleNotesChange(index: number, notes: string) {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, notes } : tx)),
    );
  }

  /**
   * Update the category for a single transaction.
   *
   * @param index - 0-based transaction index.
   * @param category - Newly selected category.
   */
  function handleCategoryChange(index: number, category: string) {
    setCategoryMap((prev) => {
      const next = new Map(prev);
      next.set(index, category);
      return next;
    });
  }

  /**
   * Persist updated categories via localStorage (synced by useLocalStorage hook).
   *
   * @param updated - Updated category list.
   */
  function handleCategoriesChange(updated: string[]) {
    setCategories(updated);
  }

  /**
   * Save the user's BYOK API key and update state.
   *
   * @param key - New API key value (empty string = cleared).
   */
  function handleApiKeyChange(key: string) {
    setApiKey(key);
  }

  /**
   * Resume a saved session: hydrate state and jump to the review step.
   */
  function handleResume() {
    const restored = restoreSession();
    if (!restored) return;
    if (savedSession) setCsvFilename(savedSession.meta.filename);
    setTransactions(restored.transactions);
    setCategoryMap(restored.categoryMap);
    setApiCategoryMap(new Map(restored.categoryMap)); // snapshot at resume time (no user edits yet)
    setCatStatus("done");
    setStep("review");
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const statusCounts = countByStatus(transactions, categoryMap, categories);
  const summary = computeSummary(transactions);

  // Reason: Date.now() is not allowed during render, so the clock used for the
  // resume banner's relative time is captured once the page has mounted.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
  }, [savedSession]);

  return (
    <AppShell
      currentStep={step}
      apiKey={apiKey}
      onApiKeyChange={handleApiKeyChange}
      categories={categories}
      onCategoriesChange={handleCategoriesChange}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Step: Upload                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "upload" && (
        <div className="flex flex-col gap-6">
          {/* Resume banner — shown when a saved session exists in localStorage */}
          {savedSession && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40">
              <FileText className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                  Resume unfinished review
                </p>
                <p className="mt-0.5 truncate text-xs text-sky-700 dark:text-sky-300">
                  {savedSession.meta.filename} &middot; {savedSession.meta.txnCount} transaction{savedSession.meta.txnCount !== 1 ? "s" : ""}
                  {now !== null && ` · ${formatRelativeTime(savedSession.meta.savedAt, now)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={handleResume}>
                  Resume
                </Button>
                <Button size="sm" variant="ghost" onClick={discard}>
                  Discard
                </Button>
              </div>
            </div>
          )}

          <UploadStep
            onFileSelect={handleFileSelect}
            hasFile={pendingFile !== null}
            isLoading={isParsing}
            error={parseError}
            onContinue={handleContinueToReview}
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Step: Review                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "review" && (
        <div className="flex flex-col gap-4">
          <TransactionTable
            transactions={transactions}
            categories={categories}
            categoryMap={categoryMap}
            status={catStatus}
            onCategoryChange={handleCategoryChange}
            onPayeeChange={handlePayeeChange}
            onNotesChange={handleNotesChange}
            onRowSelect={setSelectedIndex} // Dev-tools: pipeline-inspector
            selectedIndex={selectedIndex} // Dev-tools: pipeline-inspector
          />

          {/* Dev-tools: pipeline-inspector — inline detail pane */}
          {PipelineInspectorDevTool && (
            <PipelineInspectorDevTool
              snapshots={snapshots}
              selectedIndex={selectedIndex}
              categories={categories}
              apiKey={apiKey}
              categoryMap={apiCategoryMap}
              debugData={debugData}
              transactionCount={transactions.length}
              onSelectIndex={setSelectedIndex}
            />
          )}

          {/* Step actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="size-4" />
              Start Over
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerCategorise()}
                disabled={catStatus === "loading"}
              >
                <Sparkles className="size-4" />
                {catStatus === "loading" ? "Categorising…" : "Re-categorise"}
              </Button>
              <Button
                size="sm"
                onClick={() => setStep("export")}
                disabled={catStatus === "loading" || transactions.length === 0}
              >
                Continue to Export
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Step: Export                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "export" && (
        <ExportStep
          total={transactions.length}
          categorised={statusCounts.categorised}
          needsReview={statusCounts["needs-review"] + statusCounts.uncategorised}
          net={summary.net}
          downloaded={downloaded}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </AppShell>
  );
}

/**
 * Format a saved-at ISO string as a human-readable relative time,
 * e.g. "2 hours ago", "just now", "3 days ago".
 *
 * @param savedAt - ISO 8601 timestamp string.
 * @param now - Reference timestamp in epoch milliseconds.
 * @returns Human-readable relative time string.
 */
function formatRelativeTime(savedAt: string, now: number): string {
  const diffMs = now - new Date(savedAt).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
