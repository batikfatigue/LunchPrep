"use client";

/**
 * LunchPrep main page — Upload → Review → Export wizard.
 *
 * Orchestrates the full pipeline:
 * 1. Upload step: file drag-and-drop, API key input, category editor.
 * 2. Review step: transaction table with AI-generated categories and inline editing.
 * 3. Export step: success state with download link and start-over button.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { RefreshCw, Download, Sparkles } from "lucide-react";

import { LandingHero } from "@/components/landing-hero";
import { PipelineSteps, type PipelineStep } from "@/components/pipeline-steps";
import { FileUpload } from "@/components/file-upload";
import { ApiKeyInput } from "@/components/api-key-input";
import { CategoryEditor } from "@/components/category-editor";
import {
  TransactionTable,
  type CategorisationStatus,
} from "@/components/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useLocalStorage } from "@/hooks/use-local-storage";

import { detectAndParse } from "@/lib/parsers/registry";
import { anonymise, restore } from "@/lib/anonymiser/pii";
import { callCategorise } from "@/lib/categoriser/client";
import type { DebugData } from "@/lib/categoriser/client";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import { generateLunchMoneyCsv, downloadCsv } from "@/lib/exporter/lunchmoney";
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
  const [transactions, setTransactions] = React.useState<RawTransaction[]>([]);
  const [categoryMap, setCategoryMap] = React.useState<Map<number, string>>(
    new Map(),
  );
  const [catStatus, setCatStatus] = React.useState<CategorisationStatus>("idle");
  const [parseError, setParseError] = React.useState<string | null>(null);
  // Dev-mode only: debug data from the categorisation API (reasoning + raw payload).
  // Stays null in production since the API never returns debug data there.
  const [debugData, setDebugData] = React.useState<DebugData | null>(null);
  // Dev-tools: pipeline-inspector — snapshot of transaction state at each pipeline stage
  const [snapshots, setSnapshots] = React.useState<PipelineSnapshot>({});
  // Dev-tools: pipeline-inspector — index of the selected transaction row
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Parse a CSV file and transition to the review step.
   * Automatically triggers AI categorisation after parsing.
   *
   * @param file - The CSV File selected by the user.
   */
  async function handleFileSelect(file: File) {
    setParseError(null);
    try {
      const text = await file.text();
      const txs = detectAndParse(text);
      setTransactions(txs);
      setCategoryMap(new Map());
      setStep("review");
      // Auto-trigger categorisation immediately after parse.
      void triggerCategorise(txs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse the file.";
      setParseError(message);
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
      setCatStatus("done");
    } catch {
      // Reason: Keep status as "error" so the error banner is shown.
      // The user can still assign categories manually.
      setCatStatus("error");
    }
  }

  /**
   * Generate and download the Lunch Money CSV, then advance to the export step.
   */
  function handleExport() {
    const csv = generateLunchMoneyCsv(transactions, categoryMap);
    downloadCsv(csv);
    setStep("export");
  }

  /**
   * Reset all ephemeral state and return to the upload step.
   */
  function handleReset() {
    setTransactions([]);
    setCategoryMap(new Map());
    setCatStatus("idle");
    setParseError(null);
    setDebugData(null);
    setSnapshots({}); // Dev-tools: pipeline-inspector
    setSelectedIndex(null); // Dev-tools: pipeline-inspector
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">LunchPrep</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Convert Singapore bank CSVs into Lunch Money imports with AI categorisation.
        </p>
      </header>

      {/* Pipeline step indicator */}
      <PipelineSteps currentStep={step} />

      {/* ----------------------------------------------------------------- */}
      {/* Step: Upload                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "upload" && (
        <>
          {/* Explainer hero — shown only on the initial upload step */}
          <LandingHero />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload zone — spans 2 columns on large screens */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upload your bank CSV</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    error={parseError}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Settings sidebar */}
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="pt-6">
                  <ApiKeyInput
                    apiKey={apiKey}
                    onApiKeyChange={handleApiKeyChange}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <CategoryEditor
                    categories={categories}
                    onCategoriesChange={handleCategoriesChange}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Step: Review                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "review" && (
        <div className="flex flex-col gap-4">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} loaded. Review and edit
              before exporting.
            </p>
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
                onClick={handleExport}
                disabled={catStatus === "loading"}
              >
                <Download className="size-4" />
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="size-4" />
                Start Over
              </Button>
            </div>
          </div>

          {/* Transaction table */}
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
              categoryMap={categoryMap}
              debugData={debugData}
              transactionCount={transactions.length}
              onSelectIndex={setSelectedIndex}
            />
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Step: Export                                                        */}
      {/* ----------------------------------------------------------------- */}
      {step === "export" && (
        <div className="flex min-h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <Download className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Export complete!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your Lunch Money CSV has been downloaded.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Start Over
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
