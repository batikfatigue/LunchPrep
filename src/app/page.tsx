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
import { ArrowRight, FileText, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ExportStep } from "@/components/export/export-step";
import { UploadStep, type ImportMode } from "@/components/upload/upload-step";
import { ResumeBanner } from "@/components/upload/resume-banner";
import { ResetImportButton } from "@/components/reset-import-button";
import { type PipelineStep } from "@/components/pipeline-steps";
import {
  TransactionTable,
  computeSummary,
  type CategorisationStatus,
} from "@/components/transaction-table";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

import { useImportPreferences } from "@/hooks/use-import-preferences";
import { useSessionPersistence } from "@/hooks/use-session-persistence";

import { detectAndParse } from "@/lib/parsers/registry";
import { anonymise, restore } from "@/lib/anonymiser/pii";
import { callCategorise } from "@/lib/categoriser/client";
import type { BYOKConfig, DebugData } from "@/lib/categoriser/client";
import { createSampleStatement } from "@/lib/sample-statement";
import { generateLunchMoneyCsv, downloadCsv } from "@/lib/exporter/lunchmoney";
import { countByStatus } from "@/lib/review/status";
import type { RawTransaction } from "@/lib/parsers/types";
import type {
  PipelineSnapshot,
  GeminiSentEntry,
} from "@/lib/pipeline-snapshot"; // Dev-tools: pipeline-inspector

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

/**
 * Main LunchPrep wizard page.
 *
 * @returns The full wizard UI as a React element.
 */
export default function Home() {
  const {
    categories,
    setCategories,
    byokConfig,
    aiSettings,
    onAiSettingsChange,
  } = useImportPreferences();

  const [step, setStep] = React.useState<PipelineStep>("upload");
  const [isDemo, setIsDemo] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [transactions, setTransactions] = React.useState<RawTransaction[]>([]);
  const [categoryMap, setCategoryMap] = React.useState<Map<number, string>>(
    new Map(),
  );
  // Dev-tools: pipeline-inspector — immutable snapshot of AI-assigned categories at categorisation time.
  // Reason: Keeps the API Result Panel showing the original AI output even after user edits categoryMap.
  const [apiCategoryMap, setApiCategoryMap] = React.useState<
    ReadonlyMap<number, string>
  >(new Map());
  const [catStatus, setCatStatus] =
    React.useState<CategorisationStatus>("idle");
  // Reason: Provider errors (HTTP status, unreachable host, unparseable JSON)
  // are surfaced in the review error banner so the user can tell why a BYOK
  // endpoint failed instead of seeing a generic failure message.
  const [catError, setCatError] = React.useState<string | null>(null);
  /**
   * AI categorisation routing: "proxy" = server /api/categorise, "byok" =
   * direct browser call. null = not yet chosen — the effective mode then
   * defaults to "byok" when a key exists for the selected provider.
   */
  const [aiMode, setAiMode] = React.useState<ImportMode | null>(null);
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

  // Reason: The upload-step radio is authoritative once touched; before that
  // it defaults to BYOK whenever the selected provider has a saved key.
  const effectiveMode: ImportMode = aiMode ?? (byokConfig ? "byok" : "proxy");
  /** BYOK config gated by the selected mode — null forces the server proxy. */
  const effectiveByok: BYOKConfig | null =
    effectiveMode === "byok" ? byokConfig : null;

  // ---------------------------------------------------------------------------
  // Session persistence
  // ---------------------------------------------------------------------------

  // Reason: Only pass state to the hook when catStatus is "done" so we never
  // persist a partial or loading state. The hook handles the debounce internally.
  const {
    savedSession,
    restore: restoreSession,
    discard,
  } = useSessionPersistence(
    catStatus === "done" && !isDemo && !downloaded
      ? { filename: csvFilename, transactions, categoryMap, catStatus }
      : null,
  );

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
    if (effectiveMode === "byok" && !byokConfig) {
      setParseError(
        "Save your API key before continuing, or choose another categorisation mode.",
      );
      return;
    }
    setParseError(null);
    setIsParsing(true);
    try {
      const text = await pendingFile.text();
      const txs = detectAndParse(text);
      if (txs.length === 0)
        throw new Error(
          "No transactions found. Choose a statement with transactions and try again.",
        );
      setIsDemo(false);
      setTransactions(txs);
      setCategoryMap(new Map());
      setApiCategoryMap(new Map());
      setStep("review");
      if (effectiveMode === "manual") {
        setCatStatus("done");
      } else {
        void triggerCategorise(txs);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse the file.";
      setParseError(message);
    } finally {
      setIsParsing(false);
    }
  }

  /** Explore fictional transactions without touching a saved review or calling AI. */
  function handleTrySample() {
    const sample = createSampleStatement();
    setIsDemo(true);
    setTransactions(sample.transactions);
    setCategoryMap(sample.categoryMap);
    setApiCategoryMap(new Map(sample.categoryMap));
    setCsvFilename("sample-statement.csv");
    setDownloaded(false);
    setCatError(null);
    setCatStatus("done");
    setStep("review");
  }

  /**
   * Run the full AI categorisation pipeline:
   * anonymise → callCategorise → restore → populate categoryMap.
   *
   * @param txs - Transactions to categorise. Defaults to current state.
   */
  async function triggerCategorise(txs: RawTransaction[] = transactions) {
    setCatStatus("loading");
    setCatError(null);
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

      // Reason: BYOK mode passes the resolved config (or undefined →
      // localStorage fallback when no key is set); proxy mode passes null so
      // stored keys are ignored and /api/categorise is used as selected.
      const { results, debug } = await callCategorise(
        anonymised,
        categories,
        effectiveMode === "byok" ? (byokConfig ?? undefined) : null,
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
    } catch (err) {
      // Reason: Keep status as "error" so the error banner is shown.
      // The user can still assign categories manually.
      setCatError(err instanceof Error ? err.message : null);
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
    if (!isDemo) discard();
  }

  /**
   * Reset all ephemeral state and return to the upload step.
   */
  function handleReset() {
    setTransactions([]);
    setCategoryMap(new Map());
    setApiCategoryMap(new Map());
    setCatStatus("idle");
    setCatError(null);
    setAiMode(null);
    setParseError(null);
    setDebugData(null);
    setCsvFilename("");
    setPendingFile(null);
    setDownloaded(false);
    setSnapshots({}); // Dev-tools: pipeline-inspector
    setSelectedIndex(null); // Dev-tools: pipeline-inspector
    // Reason: Clear session on reset — user is starting over.
    if (!isDemo) discard();
    setIsDemo(false);
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
   * Resume a saved session: hydrate state and jump to the review step.
   */
  function handleResume() {
    const restored = restoreSession();
    if (!restored) return;
    setIsDemo(false);
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

  return (
    <AppShell
      currentStep={step}
      aiSettings={aiSettings}
      onAiSettingsChange={onAiSettingsChange}
      categories={categories}
      onCategoriesChange={setCategories}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Step: Upload                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "upload" && (
        <div className="flex flex-col gap-6">
          {savedSession && (
            <ResumeBanner
              session={savedSession}
              onResume={handleResume}
              onDiscard={discard}
            />
          )}

          <UploadStep
            onFileSelect={handleFileSelect}
            selectedFile={pendingFile}
            onFileClear={() => {
              setPendingFile(null);
              setParseError(null);
            }}
            isLoading={isParsing}
            error={parseError}
            onContinue={handleContinueToReview}
            onTrySample={handleTrySample}
            aiSettings={aiSettings}
            onAiSettingsChange={onAiSettingsChange}
            mode={effectiveMode}
            onModeChange={setAiMode}
          />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Step: Review                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "review" && (
        <div className="flex flex-col gap-5">
          {isDemo && (
            <Notice tone="warning">
              You&apos;re exploring a sample. All transactions are fictional,
              and your saved review stays untouched.
            </Notice>
          )}
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular truncate">{csvFilename}</span>
            <span className="tabular ml-auto shrink-0 rounded-full border-2 border-ink bg-card px-2 py-0.5 font-semibold text-foreground">
              SGD
            </span>
          </p>
          <TransactionTable
            transactions={transactions}
            categories={categories}
            categoryMap={categoryMap}
            status={catStatus}
            errorDetail={catError}
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
              byok={effectiveByok}
              categoryMap={apiCategoryMap}
              debugData={debugData}
              transactionCount={transactions.length}
              onSelectIndex={setSelectedIndex}
            />
          )}

          {/* Step actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-ink bg-card p-4 shadow-hard">
            <ResetImportButton
              onReset={handleReset}
              disabled={catStatus === "loading"}
            />
            <div className="flex flex-wrap gap-2">
              {!isDemo && effectiveMode !== "manual" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerCategorise()}
                  disabled={catStatus === "loading"}
                >
                  <Sparkles className="size-4" />
                  {catStatus === "loading" ? "Categorising…" : "Re-categorise"}
                </Button>
              )}
              <Button
                onClick={() => setStep("export")}
                disabled={catStatus === "loading" || transactions.length === 0}
              >
                Continue to export
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
          needsReview={
            statusCounts["needs-review"] + statusCounts.uncategorised
          }
          net={summary.net}
          downloaded={downloaded}
          isDemo={isDemo}
          onDownload={handleDownload}
          onReset={handleReset}
          onBack={() => {
            setDownloaded(false);
            setStep("review");
          }}
        />
      )}
    </AppShell>
  );
}
