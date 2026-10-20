"use client";

import * as React from "react";
import {
  ArrowUpRight,
  BookOpen,
  Github,
  LockKeyhole,
  Settings2,
  Sparkles,
  Tags,
  X,
  Menu,
  type LucideIcon,
} from "lucide-react";
import type { AiProviderSettings } from "@/components/api-key-input";
import { PipelineSteps, type PipelineStep } from "@/components/pipeline-steps";
import {
  SettingsDialog,
  type SettingsPanel,
} from "@/components/settings-dialog";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_VERSION, GITHUB_URL } from "@/lib/app-meta";

export interface AppShellProps {
  currentStep: PipelineStep;
  aiSettings: AiProviderSettings;
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  /** True while parsing or categorising is genuinely running. */
  busy?: boolean;
  children: React.ReactNode;
}

const TOOLS: Array<{ panel: SettingsPanel; label: string; icon: LucideIcon }> =
  [
    { panel: "categories", label: "Categories", icon: Tags },
    { panel: "ai", label: "AI preferences", icon: Sparkles },
    { panel: "general", label: "Settings", icon: Settings2 },
  ];

/** Top-bar workspace: brand, progress, tools. Content gets the full width. */
export function AppShell({
  currentStep,
  aiSettings,
  onAiSettingsChange,
  categories,
  onCategoriesChange,
  busy = false,
  children,
}: AppShellProps) {
  const [panel, setPanel] = React.useState<SettingsPanel | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const mainRef = React.useRef<HTMLElement | null>(null);
  const previousStep = React.useRef(currentStep);
  React.useEffect(() => {
    if (previousStep.current === currentStep) return;
    previousStep.current = currentStep;
    mainRef.current?.querySelector("h1")?.focus({ preventScroll: true });
    // Reason: a step swap replaces the page, so jump instead of gliding.
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep]);
  const openPanel = (next: SettingsPanel) => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setMenuOpen(false);
    setPanel(next);
  };

  const linkClass =
    "inline-flex h-9 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground";

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b bg-background">
        {/* Reason: one stepper element, re-placed by grid so assistive tech
            never sees a duplicate progress landmark. */}
        <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto] items-center gap-x-4 px-5 pt-3 sm:px-8 md:h-[68px] md:grid-cols-[1fr_auto_1fr] md:px-12 md:py-0">
          <Wordmark />
          <div className="col-span-2 row-start-2 -mb-px justify-self-start md:col-span-1 md:col-start-2 md:row-start-1 md:mb-0 md:justify-self-center">
            <PipelineSteps currentStep={currentStep} busy={busy} />
          </div>
          <div className="flex items-center justify-self-end gap-1 md:col-start-3 md:row-start-1">
            <nav
              aria-label="Workspace"
              className="hidden items-center gap-0.5 lg:flex"
            >
              {TOOLS.map(({ panel: id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openPanel(id)}
                  className={linkClass}
                >
                  {label}
                </button>
              ))}
              <a
                href={`${GITHUB_URL}#how-it-works`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} gap-1`}
              >
                Guide
                <ArrowUpRight className="size-3" aria-hidden />
              </a>
            </nav>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle workspace menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="lg:hidden"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Workspace"
            className="border-t bg-background px-5 py-2 sm:px-8 lg:hidden"
          >
            {TOOLS.map(({ panel: id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => openPanel(id)}
                className="flex w-full items-center gap-3 border-b py-4 text-left text-base last:border-b-0"
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {label}
              </button>
            ))}
            <a
              href={`${GITHUB_URL}#how-it-works`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-4 text-base"
            >
              <BookOpen className="size-4 text-muted-foreground" aria-hidden />
              Import guide
              <ArrowUpRight className="ml-auto size-3.5" aria-hidden />
            </a>
          </nav>
        )}
      </header>

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1320px] px-5 pb-8 pt-10 outline-none sm:px-8 md:px-12 lg:pt-16"
      >
        <div key={currentStep} className="rise">
          {children}
        </div>
      </main>

      <footer className="mt-[clamp(64px,9vw,128px)] border-t">
        <div className="mx-auto grid max-w-[1320px] gap-x-12 gap-y-12 px-5 pb-10 pt-14 sm:px-8 md:px-12 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-6">
            <Wordmark size={56} className="mb-8 gap-3 [&>span]:text-2xl" />
            <p className="statement max-w-[14ch]">
              A little prep, then it&apos;s <em>yours.</em>
            </p>
          </div>
          <div className="flex flex-col gap-8 lg:col-span-4 lg:col-start-9">
            <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
              <LockKeyhole className="mt-1 size-4 shrink-0" aria-hidden />
              <span>
                No bank connection. Your CSV is read in this browser, and names
                and account numbers are masked before any AI request.
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet inline-flex items-center gap-1.5 text-sm"
              >
                <Github className="size-3.5" aria-hidden /> Open source
                <ArrowUpRight className="size-3" aria-hidden />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t pt-6 lg:col-span-12 lg:flex-row lg:justify-between">
            <p className="label">Independent community tool, v{APP_VERSION}</p>
            <p className="label max-w-[70ch] normal-case tracking-normal lg:text-right">
              LunchPrep is an independent open-source tool. It is not
              affiliated with or endorsed by Lunch Money; it only writes a CSV
              that Lunch Money can import.
            </p>
          </div>
        </div>
      </footer>

      <SettingsDialog
        panel={panel}
        onClose={() => setPanel(null)}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
        aiSettings={aiSettings}
        onAiSettingsChange={onAiSettingsChange}
        categories={categories}
        onCategoriesChange={onCategoriesChange}
      />
    </div>
  );
}
