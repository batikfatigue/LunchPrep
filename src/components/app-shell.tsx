"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog } from "radix-ui";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  FileUp,
  Github,
  Layers2,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tags,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { CategoryEditor } from "@/components/category-editor";
import { PipelineSteps, type PipelineStep } from "@/components/pipeline-steps";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_VERSION, GITHUB_URL } from "@/lib/app-meta";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  currentStep: PipelineStep;
  aiSettings: AiProviderSettings;
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  children: React.ReactNode;
}

type SettingsPanel = "general" | "ai" | "categories";

/** Responsive workspace with shared, keyboard-accessible settings. */
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
    setPanel(next);
  };

  return (
    <div className="min-h-screen lg:pl-60">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-card p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card px-5 py-8 lg:flex">
        <Wordmark />
        <nav aria-label="Workspace" className="mt-12 flex-1">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">
            WORKSPACE
          </p>
          <div
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-accent px-3 py-3 text-sm font-semibold text-primary"
          >
            <FileUp className="size-4" aria-hidden /> Statement import
            <span className="ml-auto size-1.5 rounded-full bg-brand" />
          </div>
          <SidebarButton icon={Tags} onClick={() => openPanel("categories")}>
            Categories
          </SidebarButton>
          <SidebarButton icon={Sparkles} onClick={() => openPanel("ai")}>
            AI preferences
          </SidebarButton>
          <div className="mt-8 border-t pt-5">
            <SidebarButton
              icon={Settings2}
              onClick={() => openPanel("general")}
            >
              Settings
            </SidebarButton>
            <a
              href={`${GITHUB_URL}#how-it-works`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <BookOpen className="size-4" aria-hidden /> Import guide{" "}
              <ArrowUpRight className="ml-auto size-3.5" aria-hidden />
            </a>
          </div>
        </nav>
        <div className="rounded-xl border bg-background p-4">
          <ShieldCheck className="mb-3 size-5 text-primary" aria-hidden />
          <p className="text-xs font-semibold">Your finances. Your control.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            No bank connection needed. You choose what to import.
          </p>
        </div>
        <a
          href="https://lunchmoney.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 self-start rounded-md bg-white p-1.5"
        >
          <Image
            src="/powered-by-lunch-money.png"
            alt="Powered by Lunch Money"
            width={146}
            height={42}
          />
        </a>
        <p className="mt-3 px-1 text-[10px] text-muted-foreground">
          Independent community tool · v{APP_VERSION}
        </p>
      </aside>

      <header className="flex min-h-20 items-center justify-between gap-3 border-b bg-card px-5 sm:px-8 lg:px-10">
        <div className="hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
          Workspace <ChevronRight className="size-3" aria-hidden />
          <span className="font-medium text-foreground">Statement import</span>
        </div>
        <div className="lg:hidden">
          <Wordmark />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <LockKeyhole className="size-3.5 text-primary" aria-hidden />{" "}
            Private by design
          </span>
          <span className="hidden h-4 border-l sm:block" />
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
            {menuOpen ? (
              <X className="size-5" />
            ) : (
              <Settings2 className="size-5" />
            )}
          </Button>
        </div>
      </header>
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Workspace"
          className="border-b bg-card px-5 py-3 lg:hidden"
        >
          <SidebarButton icon={Tags} onClick={() => openPanel("categories")}>
            Categories
          </SidebarButton>
          <SidebarButton icon={Sparkles} onClick={() => openPanel("ai")}>
            AI preferences
          </SidebarButton>
          <SidebarButton icon={Settings2} onClick={() => openPanel("general")}>
            Settings
          </SidebarButton>
          <a
            href={`${GITHUB_URL}#how-it-works`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-3 text-sm text-muted-foreground"
          >
            Import guide ↗
          </a>
        </nav>
      )}
      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1240px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9"
      >
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <PipelineSteps currentStep={currentStep} />
          <span className="hidden text-xs text-muted-foreground xl:block">
            A fresh start for your transactions.
          </span>
        </div>
        <div
          key={currentStep}
          className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
        >
          {children}
        </div>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[11px] text-muted-foreground">
          <p>Made for a little less admin, and a little more life.</p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <Github className="size-3.5" aria-hidden /> Open source{" "}
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
          <a
            href="https://lunchmoney.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-primary lg:hidden"
          >
            Built for Lunch Money
          </a>
        </footer>
      </main>

      <Dialog.Root
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm" />
          <Dialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggerRef.current?.focus();
            }}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  {panel === "categories"
                    ? "Your categories"
                    : panel === "ai"
                      ? "AI preferences"
                      : "Workspace settings"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  Make LunchPrep work your way. Preferences save on this device.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close settings">
                  <X className="size-4" />
                </Button>
              </Dialog.Close>
            </div>
            <div className="flex flex-col gap-6 overflow-y-auto p-6">
              {panel === "general" && (
                <section>
                  <p className="text-sm font-semibold">Appearance</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Use the theme button in the header to switch between light,
                    dark, and your system preference.
                  </p>
                </section>
              )}
              {panel !== "categories" && (
                <section className={cn(panel === "general" && "border-t pt-5")}>
                  <ApiKeyInput
                    settings={aiSettings}
                    onSettingsChange={onAiSettingsChange}
                  />
                </section>
              )}
              {panel !== "ai" && (
                <section className={cn(panel === "general" && "border-t pt-5")}>
                  <CategoryEditor
                    categories={categories}
                    onCategoriesChange={onCategoriesChange}
                  />
                </section>
              )}
            </div>
            <div className="flex justify-end border-t px-6 py-4">
              <Dialog.Close asChild>
                <Button>Done</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** Distinct LunchPrep identity, separate from the integration badge. */
function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Layers2 className="size-5" strokeWidth={1.7} aria-hidden />
      </span>
      <span className="text-xl font-bold tracking-[-0.7px]">
        lunchprep<span className="text-brand">.</span>
      </span>
    </div>
  );
}

function SidebarButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: LucideIcon;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </button>
  );
}
