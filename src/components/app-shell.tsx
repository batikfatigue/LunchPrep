"use client";

import * as React from "react";
import Image from "next/image";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_VERSION, GITHUB_URL } from "@/lib/app-meta";

export interface AppShellProps {
  currentStep: PipelineStep;
  aiSettings: AiProviderSettings;
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
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
    window.scrollTo({ top: 0 });
  }, [currentStep]);
  const openPanel = (next: SettingsPanel) => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setMenuOpen(false);
    setPanel(next);
  };

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-card p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b-2 border-ink bg-background/90 backdrop-blur">
        {/* Reason: one stepper element, re-placed by grid so assistive tech
            never sees a duplicate progress landmark. */}
        <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-8 md:h-16 md:grid-cols-[1fr_auto_1fr] md:py-0">
          <Wordmark />
          <div className="col-span-2 row-start-2 justify-self-center md:col-span-1 md:col-start-2 md:row-start-1">
            <PipelineSteps currentStep={currentStep} />
          </div>
          <div className="flex items-center justify-self-end gap-1.5 md:col-start-3 md:row-start-1">
            <nav
              aria-label="Workspace"
              className="hidden items-center gap-1 lg:flex"
            >
              {TOOLS.map(({ panel: id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  size="sm"
                  onClick={() => openPanel(id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="hidden xl:inline">{label}</span>
                  <span className="sr-only xl:hidden">{label}</span>
                </Button>
              ))}
              <a
                href={`${GITHUB_URL}#how-it-works`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Import guide"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <BookOpen className="size-4" aria-hidden />
                <span className="hidden xl:inline">Guide</span>
              </a>
            </nav>
            <ThemeToggle />
            <Button
              variant="outline"
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
            className="border-t-2 border-ink bg-card px-4 py-2 lg:hidden"
          >
            {TOOLS.map(({ panel: id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => openPanel(id)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium hover:bg-accent"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
            <a
              href={`${GITHUB_URL}#how-it-works`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium hover:bg-accent"
            >
              <BookOpen className="size-4" aria-hidden /> Import guide
              <ArrowUpRight className="ml-auto size-3.5" aria-hidden />
            </a>
          </nav>
        )}
      </header>

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1280px] px-4 py-8 outline-none sm:px-8 lg:py-12"
      >
        <div
          key={currentStep}
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
        >
          {children}
        </div>
      </main>

      <footer className="border-t-2 border-ink bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 text-xs text-muted-foreground sm:px-8">
          <a
            href="https://lunchmoney.app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-white p-1.5 ring-1 ring-border"
          >
            <Image
              src="/powered-by-lunch-money.png"
              alt="Powered by Lunch Money"
              width={130}
              height={38}
            />
          </a>
          <p className="flex items-center gap-1.5">
            <LockKeyhole className="size-3.5 text-primary" aria-hidden />
            No bank connection. Your CSV never leaves this device unmasked.
          </p>
          <p className="sm:ml-auto">
            Independent community tool, <span className="tabular">v{APP_VERSION}</span>
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
          >
            <Github className="size-3.5" aria-hidden /> Open source{" "}
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
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

/** Distinct LunchPrep identity, separate from the integration badge. */
function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/icon.png"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 object-contain"
      />
      <span className="font-display text-xl font-bold tracking-tight">
        lunchprep
      </span>
    </div>
  );
}
