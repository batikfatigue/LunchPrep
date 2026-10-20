"use client";

import { RadioGroup } from "radix-ui";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { FileUpload } from "@/components/file-upload";
import { LandingGuide, LandingHero } from "@/components/landing-hero";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

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
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-x-14">
      <LandingHero />
      <section
        aria-labelledby="upload-title"
        className="min-w-0 overflow-hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 rounded-xl border-2 border-ink bg-card shadow-hard-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-cta/25 px-5 py-4 sm:px-6">
          <div>
            <h2 id="upload-title" className="text-xl font-semibold">
              Import a statement
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Start with a fresh export from your bank.
            </p>
          </div>
          <span className="rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-[11px] font-semibold">
            CSV
          </span>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3 rounded-md border-2 border-border px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-background text-[11px] font-bold">
              DBS
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">DBS / POSB</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Personal banking, CSV statement
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />{" "}
              Supported
            </span>
          </div>
          <FileUpload
            onFileSelect={onFileSelect}
            onFileClear={onFileClear}
            selectedFile={selectedFile}
            isLoading={isLoading}
            error={error}
          />
          <details className="group rounded-md border-2 border-border">
            <summary className="flex items-center gap-2.5 rounded-md p-3.5 text-xs">
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
            <div className="border-t-2 border-border p-4">
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
                <div className="mt-5 border-t-2 border-border pt-4">
                  <ApiKeyInput
                    settings={aiSettings}
                    onSettingsChange={onAiSettingsChange}
                  />
                </div>
              )}
            </div>
          </details>
          {needsKey && (
            <Notice tone="warning">
              Add and save your API key under Categorisation to continue.
            </Notice>
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
          <details className="group text-xs">
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
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t-2 border-ink bg-background px-5 py-4 text-xs">
          <span className="text-muted-foreground">Just looking around?</span>
          <button
            type="button"
            onClick={onTrySample}
            disabled={isLoading}
            className="inline-flex items-center gap-1 font-semibold underline decoration-cta decoration-[3px] underline-offset-4 hover:decoration-foreground disabled:opacity-50"
          >
            Try a sample statement{" "}
            <ArrowUpRight className="size-3" aria-hidden />
          </button>
        </div>
      </section>
      <LandingGuide />
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
        className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-card data-[state=checked]:bg-cta"
      >
        <RadioGroup.Indicator className="size-2 rounded-full bg-foreground" />
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
