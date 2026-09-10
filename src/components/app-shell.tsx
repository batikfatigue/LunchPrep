"use client";

/**
 * App shell: the bordered card that frames every wizard step.
 *
 * Provides the persistent header (wordmark, step pills, settings) and footer
 * (project links). Settings — theme, BYOK key and the category list — live in
 * a dialog so the step content stays focused on one task at a time.
 */

import * as React from "react";
import { Dialog } from "radix-ui";
import { Github, Settings, X } from "lucide-react";

import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { CategoryEditor } from "@/components/category-editor";
import { PipelineSteps, type PipelineStep } from "@/components/pipeline-steps";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_VERSION, GITHUB_URL } from "@/lib/app-meta";

export interface AppShellProps {
  /** Active wizard step, shown in the header pills. */
  currentStep: PipelineStep;
  /** Current BYOK provider settings (provider + keys + overrides). */
  aiSettings: AiProviderSettings;
  /** Called when the user changes any AI provider setting. */
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  /** Active category list. */
  categories: string[];
  /** Called when the user edits or reorders categories. */
  onCategoriesChange: (categories: string[]) => void;
  /** Step content. */
  children: React.ReactNode;
}

/**
 * Frame the wizard with a header, footer and settings dialog.
 *
 * @param props - See AppShellProps.
 */
export function AppShell({
  currentStep,
  aiSettings,
  onAiSettingsChange,
  categories,
  onCategoriesChange,
  children,
}: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:py-10">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <LunchPrepMark />
            <span className="font-semibold tracking-tight">LunchPrep</span>
          </div>

          <PipelineSteps currentStep={currentStep} />

          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open settings">
                <Settings className="size-4" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-lg focus:outline-none">
                <div className="flex items-center justify-between border-b px-5 py-3">
                  <Dialog.Title className="font-semibold">Settings</Dialog.Title>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close settings">
                      <X className="size-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Configure appearance, your AI provider settings, and the category list.
                </Dialog.Description>

                <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
                  <section className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Appearance</p>
                      <p className="text-xs text-muted-foreground">
                        Cycle between light, dark and system themes.
                      </p>
                    </div>
                    <ThemeToggle />
                  </section>

                  <section className="border-t pt-5">
                    <ApiKeyInput
                      settings={aiSettings}
                      onSettingsChange={onAiSettingsChange}
                    />
                  </section>

                  <section className="border-t pt-5">
                    <CategoryEditor
                      categories={categories}
                      onCategoriesChange={onCategoriesChange}
                    />
                  </section>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </header>

        {/* Step content */}
        <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <p>
            Open source &middot; Built for the Lunch Money community &middot; v{APP_VERSION}
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Github className="size-3.5" aria-hidden />
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}

/**
 * Small document-with-leaf wordmark shown next to the app name.
 *
 * @returns The mark as a React element.
 */
function LunchPrepMark() {
  return (
    <span
      aria-hidden
      className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4" strokeWidth={1.8}>
        <path
          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
          stroke="currentColor"
          strokeLinejoin="round"
        />
        <path d="M14 3v5h5" stroke="currentColor" strokeLinejoin="round" />
        <path
          d="M9 15.5c2.8.4 4.6-1 5-3.5-2.6-.5-4.6.8-5 3.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
