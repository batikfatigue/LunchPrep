"use client";

import { RadioGroup } from "radix-ui";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileCheck2,
  FileText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { FileUpload } from "@/components/file-upload";
import { LandingHero } from "@/components/landing-hero";
import { Button } from "@/components/ui/button";

export type ImportMode = "proxy" | "byok" | "manual";

export interface UploadStepProps {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  selectedFile: File | null;
  isLoading: boolean;
  error: string | null;
  onContinue: () => void;
  onTrySample: () => void;
  aiSettings: AiProviderSettings;
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
}

/** A focused import form with progressive AI settings and contextual help. */
export function UploadStep({
  onFileSelect,
  onFileClear,
  selectedFile,
  isLoading,
  error,
  onContinue,
  onTrySample,
  aiSettings,
  onAiSettingsChange,
  mode,
  onModeChange,
}: UploadStepProps) {
  const hasKey = Boolean(
    (aiSettings.provider === "openai"
      ? aiSettings.openaiKey
      : aiSettings.geminiKey
    ).trim(),
  );
  const needsKey = mode === "byok" && !hasKey;

  return (
    <div className="flex flex-col gap-8">
      <LandingHero />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section
          aria-labelledby="upload-title"
          className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-[0_2px_8px_0_#253d3a03]"
        >
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="upload-title"
                className="text-lg font-semibold tracking-tight"
              >
                Import a statement
              </h2>
              <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                CSV files
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Start with a fresh export from your bank.
            </p>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[11px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                DBS
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">DBS / POSB</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Personal banking · CSV statement
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-primary">
                <Check className="size-3" aria-hidden /> Supported
              </span>
            </div>
            <FileUpload
              onFileSelect={onFileSelect}
              onFileClear={onFileClear}
              selectedFile={selectedFile}
              isLoading={isLoading}
              error={error}
            />
            <details className="group rounded-lg border bg-background/60">
              <summary className="flex items-center gap-2.5 rounded-lg p-3.5 text-xs">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <span className="font-semibold">Categorisation</span>
                <span className="ml-auto text-muted-foreground">
                  {mode === "proxy"
                    ? "Shared AI"
                    : mode === "manual"
                      ? "Manual"
                      : "Your API key"}
                </span>
                <ChevronDown
                  className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="border-t p-4">
                <RadioGroup.Root
                  aria-label="Categorisation mode"
                  value={mode}
                  onValueChange={(value: ImportMode) => onModeChange(value)}
                  className="space-y-4"
                >
                  <ModeOption
                    value="proxy"
                    title="Use shared AI"
                    description="Send anonymised transaction details through our server to the configured AI provider."
                  />
                  <ModeOption
                    value="byok"
                    title="Use my own API key"
                    description="Choose Gemini or an OpenAI-compatible provider. A server relay may be used if needed."
                  />
                  <ModeOption
                    value="manual"
                    title="I'll categorise myself"
                    description="Skip AI. Review and assign categories entirely in your browser."
                  />
                </RadioGroup.Root>
                {mode === "byok" && (
                  <div className="mt-5 border-t pt-4">
                    <ApiKeyInput
                      settings={aiSettings}
                      onSettingsChange={onAiSettingsChange}
                    />
                  </div>
                )}
              </div>
            </details>
            {needsKey && (
              <p
                role="status"
                className="text-xs text-amber-800 dark:text-amber-300"
              >
                Add and save your API key under Categorisation to continue.
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedFile || isLoading || needsKey}
              onClick={onContinue}
            >
              {isLoading ? "Preparing your statement…" : "Continue to review"}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <LockKeyhole className="size-3" aria-hidden /> Your original CSV
              is processed on this device.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t bg-background/70 px-5 py-4 text-xs">
            <span className="text-muted-foreground">Just looking around?</span>
            <button
              type="button"
              onClick={onTrySample}
              disabled={isLoading}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
            >
              Try a sample statement{" "}
              <ArrowUpRight className="size-3" aria-hidden />
            </button>
          </div>
        </section>
        <aside className="space-y-5">
          <section className="rounded-2xl border bg-card p-5">
            <span className="mb-4 flex size-9 items-center justify-center rounded-xl bg-[#fff3c4] text-[#805d00] dark:bg-amber-950 dark:text-amber-300">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <h2 className="text-sm font-semibold">From statement to sorted.</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Three small steps. One tidier budget.
            </p>
            <ol className="mt-5 space-y-5">
              <GuideStep
                icon={FileText}
                title="Upload your CSV"
                detail="We clean up the bank's formatting."
              />
              <GuideStep
                icon={Sparkles}
                title="Make it yours"
                detail="Review payees and suggested categories."
              />
              <GuideStep
                icon={FileCheck2}
                title="Ready for Lunch Money"
                detail="Download a clean, compatible CSV."
              />
            </ol>
          </section>
          <section className="rounded-2xl border border-primary/15 bg-accent/70 p-5">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-4" aria-hidden />
              <h2 className="text-sm font-semibold">
                A little privacy goes a long way.
              </h2>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Your CSV stays on your device. Identifying details are masked
              before AI requests. Reviews are saved in this browser so you can
              pick up later.
            </p>
          </section>
          <details className="group px-1 text-xs">
            <summary className="flex items-center justify-between gap-2 rounded-md py-1 font-medium text-muted-foreground">
              Where do I find my CSV?
              <ChevronDown
                className="size-3.5 shrink-0 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-2 leading-5 text-muted-foreground">
              In DBS / POSB internet banking, open your account&apos;s
              transaction history, choose a date range, and export as CSV. PDF
              statements aren&apos;t supported.
            </p>
          </details>
        </aside>
      </div>
    </div>
  );
}

function ModeOption({
  value,
  title,
  description,
}: {
  value: ImportMode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <RadioGroup.Item
        id={`mode-${value}`}
        value={value}
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-card data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      >
        <RadioGroup.Indicator className="size-1.5 rounded-full bg-primary-foreground" />
      </RadioGroup.Item>
      <label htmlFor={`mode-${value}`} className="cursor-pointer text-xs">
        <span className="font-semibold">{title}</span>
        <span className="mt-1 block leading-5 text-muted-foreground">
          {description}
        </span>
      </label>
    </div>
  );
}

function GuideStep({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          {detail}
        </p>
      </div>
    </li>
  );
}
