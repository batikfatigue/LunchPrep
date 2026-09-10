"use client";

/**
 * Upload step: hero, CSV drop zone, format selector, privacy note and the
 * AI categorisation mode choice.
 *
 * The parent owns the selected file and the BYOK key; this component only
 * arranges the controls and gates the "Continue to Review" action until a
 * file has been chosen.
 */

import * as React from "react";
import { RadioGroup, Select } from "radix-ui";
import { ArrowRight, ChevronDown, HelpCircle, Lock, Sparkles } from "lucide-react";

import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { FileUpload } from "@/components/file-upload";
import { LandingHero } from "@/components/landing-hero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** CSV formats offered in the selector. Detection itself is automatic. */
const CSV_FORMATS = [
  { value: "dbs-ibanking-personal", label: "DBS iBanking (Personal)" },
] as const;

export interface UploadStepProps {
  /** Called when the user picks or drops a CSV file. */
  onFileSelect: (file: File) => void;
  /** Whether a file is currently selected and ready to parse. */
  hasFile: boolean;
  /** Whether parsing is in flight. */
  isLoading: boolean;
  /** Parse error to surface under the drop zone. */
  error: string | null;
  /** Advance to the review step (parses the selected file). */
  onContinue: () => void;
  /** Current BYOK provider settings (provider + keys + overrides). */
  aiSettings: AiProviderSettings;
  /** Called when the user changes any AI provider setting. */
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  /**
   * AI categorisation routing. "proxy" calls the server /api/categorise route;
   * "byok" calls the provider directly from the browser with the saved key.
   */
  mode: "proxy" | "byok";
  /** Called when the user switches between proxy and BYOK mode. */
  onModeChange: (mode: "proxy" | "byok") => void;
}

/**
 * Render the upload step.
 *
 * @param props - See UploadStepProps.
 */
export function UploadStep({
  onFileSelect,
  hasFile,
  isLoading,
  error,
  onContinue,
  aiSettings,
  onAiSettingsChange,
  mode,
  onModeChange,
}: UploadStepProps) {
  const [format, setFormat] = React.useState<string>(CSV_FORMATS[0].value);

  return (
    <div className="flex flex-col gap-6">
      <LandingHero />

      <FileUpload onFileSelect={onFileSelect} isLoading={isLoading} error={error} />

      {/* CSV format */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor="csv-format" className="text-sm font-medium">
            Select your CSV format
          </label>
          <span
            title="LunchPrep auto-detects the format from the file's headers. This selector shows which exports are supported."
            className="text-muted-foreground"
          >
            <HelpCircle className="size-3.5" aria-hidden />
            <span className="sr-only">
              LunchPrep auto-detects the format from the file&apos;s headers.
            </span>
          </span>
        </div>
        <Select.Root value={format} onValueChange={setFormat}>
          <Select.Trigger
            id="csv-format"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm",
              "focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
            aria-label="CSV format"
          >
            <Select.Value />
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={4}
              className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border bg-popover shadow-md"
            >
              <Select.Viewport>
                {CSV_FORMATS.map((f) => (
                  <Select.Item
                    key={f.value}
                    value={f.value}
                    className="cursor-pointer px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <Select.ItemText>{f.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Privacy */}
      <section className="flex gap-3 rounded-xl border p-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <Lock className="size-4" aria-hidden />
        </span>
        <div className="text-sm">
          <p className="font-medium">Privacy first</p>
          <p className="mt-1 text-muted-foreground">
            Your data stays in your browser. Names and account numbers are
            anonymised before AI categorisation.
          </p>
          <a
            href="https://github.com/batikfatigue/LunchPrep#privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Learn more
            <ArrowRight className="size-3" aria-hidden />
          </a>
        </div>
      </section>

      {/* AI categorisation mode */}
      <section className="flex gap-3 rounded-xl border p-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">AI categorisation</p>
          <RadioGroup.Root
            value={mode}
            onValueChange={(value) => onModeChange(value as "proxy" | "byok")}
            className="mt-3 flex flex-col gap-3"
          >
            <ModeOption
              value="proxy"
              title="Use shared proxy (default)"
              description="Anonymised data is sent to our proxy server for categorisation."
            />
            <ModeOption
              value="byok"
              title="Bring your own API key (BYOK)"
              description="Send requests directly to your AI provider from your browser."
            />
          </RadioGroup.Root>

          {mode === "byok" && (
            <div className="mt-4 border-t pt-4">
              <ApiKeyInput
                settings={aiSettings}
                onSettingsChange={onAiSettingsChange}
              />
            </div>
          )}
        </div>
      </section>

      <Button size="lg" disabled={!hasFile || isLoading} onClick={onContinue}>
        {isLoading ? "Parsing…" : "Continue to Review"}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

/**
 * One radio option in the AI categorisation card.
 *
 * @param props.value - Radio value.
 * @param props.title - Option title.
 * @param props.description - Supporting copy.
 */
function ModeOption({
  value,
  title,
  description,
}: {
  value: string;
  title: string;
  description: string;
}) {
  const id = `ai-mode-${value}`;
  return (
    <div className="flex items-start gap-3">
      <RadioGroup.Item
        id={id}
        value={value}
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        )}
      >
        <RadioGroup.Indicator className="size-1.5 rounded-full bg-primary-foreground" />
      </RadioGroup.Item>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </label>
    </div>
  );
}
