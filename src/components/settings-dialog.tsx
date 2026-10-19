"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import {
  ApiKeyInput,
  type AiProviderSettings,
} from "@/components/api-key-input";
import { CategoryEditor } from "@/components/category-editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SettingsPanel = "general" | "ai" | "categories";

export interface SettingsDialogProps {
  panel: SettingsPanel | null;
  onClose: () => void;
  /** Called after the dialog closes so focus can return to its trigger. */
  onCloseAutoFocus: (event: Event) => void;
  aiSettings: AiProviderSettings;
  onAiSettingsChange: (patch: Partial<AiProviderSettings>) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

const TITLES: Record<SettingsPanel, string> = {
  categories: "Your categories",
  ai: "AI preferences",
  general: "Workspace settings",
};

/** Shared preferences dialog opened from the header toolbar. */
export function SettingsDialog({
  panel,
  onClose,
  onCloseAutoFocus,
  aiSettings,
  onAiSettingsChange,
  categories,
  onCategoriesChange,
}: SettingsDialogProps) {
  return (
    <Dialog.Root
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-foreground/30 bg-card"
        >
          <div className="flex items-start justify-between gap-4 border-b px-6 py-6 sm:px-8">
            <div>
              <Dialog.Title className="text-[clamp(1.75rem,5vw,2.25rem)] leading-none tracking-[-0.04em]">
                {panel ? TITLES[panel] : ""}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Make LunchPrep work your way. Preferences save on this device.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close settings">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-8 overflow-y-auto p-6 sm:p-8">
            {panel === "general" && (
              <section>
                <p className="label">Appearance</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Use the theme button in the header to switch between light,
                  dark, and your system preference.
                </p>
              </section>
            )}
            {panel !== "categories" && (
              <section className={cn(panel === "general" && "border-t pt-8")}>
                <ApiKeyInput
                  settings={aiSettings}
                  onSettingsChange={onAiSettingsChange}
                />
              </section>
            )}
            {panel !== "ai" && (
              <section className={cn(panel === "general" && "border-t pt-8")}>
                <CategoryEditor
                  categories={categories}
                  onCategoriesChange={onCategoriesChange}
                />
              </section>
            )}
          </div>
          <div className="flex justify-end border-t px-6 py-4 sm:px-8">
            <Dialog.Close asChild>
              <Button>Done</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
