"use client";

import * as React from "react";
import { RadioGroup } from "radix-ui";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { FileUpload } from "@/components/file-upload";
import { LandingGuide, LandingHero } from "@/components/landing-hero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const canContinue = Boolean(selectedFile) && !isLoading && !needsKey;

  return (
    <div className="flex flex-col gap-[clamp(72px,10vw,144px)]">
      <LandingHero />

      <section
        id="import"
        aria-labelledby="upload-title"
        className="grid gap-x-12 gap-y-10 border-t pt-8 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <p className="label !text-ok">
            <span id="import-label">Import a statement</span>
          </p>
          <h2
            id="upload-title"
            tabIndex={-1}
            className="statement mt-6 outline-none"
          >
            Start with a <em className="em-fill">fresh export.</em>
          </h2>
          <p className="mt-6 max-w-[34ch] text-sm leading-6 text-muted-foreground">
            In DBS / POSB internet banking, open your account&apos;s
            transaction history, choose a date range and export as CSV. PDF
            statements aren&apos;t supported.
          </p>
          <p className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">Just looking around?</span>
            <button
              type="button"
              onClick={onTrySample}
              disabled={isLoading}
              className="link-quiet inline-flex items-center gap-1 disabled:opacity-50"
            >
              Try a sample statement{" "}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </button>
          </p>
        </div>

        <div className="min-w-0 space-y-10 lg:col-span-7 lg:col-start-6">
          <div className="flex items-center gap-4 border-b pb-5">
            <span className="label flex h-8 min-w-12 shrink-0 items-center justify-center rounded-full border border-ok px-3 !text-ok">
              DBS
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base">DBS / POSB</p>
              <p className="text-sm text-muted-foreground">
                Personal banking, CSV statement
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-sm text-ok">
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
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
          <details className="group border-y">
            <summary className="flex items-center gap-3 py-5">
              <span className="label !text-foreground">Categorisation</span>
              <span className="ml-auto text-sm text-muted-foreground">
                {mode === "proxy"
                  ? "Shared AI"
                  : mode === "manual"
                    ? "Manual"
                    : "Your API key"}
              </span>
              <ChevronDown
                className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="pb-8 pt-2">
              <RadioGroup.Root
                aria-label="Categorisation mode"
                value={mode}
                onValueChange={(value: ImportMode) => onModeChange(value)}
                className="space-y-6"
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
                <div className="mt-8 border-t pt-8">
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
            className={cn(
              "w-full sm:w-auto",
              // Reason: gold only when the step is ready, so the one live action stands out.
              canContinue && "bg-marker text-marker-foreground hover:bg-marker/85",
            )}
            size="lg"
            disabled={!canContinue}
            onClick={onContinue}
          >
            {isLoading ? "Preparing your statement…" : "Continue to review"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
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
        className="mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-input bg-card transition-colors data-[state=checked]:border-ok"
      >
        <RadioGroup.Indicator className="size-2 rounded-full bg-ok" />
      </RadioGroup.Item>
      <label htmlFor={`mode-${value}`} className="cursor-pointer text-sm">
        <span className="font-medium">{title}</span>
        <span className="mt-1 block leading-6 text-muted-foreground">
          {description}
        </span>
      </label>
    </div>
  );
}
