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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border-2 border-ink bg-card shadow-hard-lg"
        >
          <div className="flex items-center justify-between border-b-2 border-ink bg-cta/25 px-6 py-5">
            <div>
              <Dialog.Title className="text-xl font-semibold">
                {panel ? TITLES[panel] : ""}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                Make LunchPrep work your way. Preferences save on this device.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="outline" size="icon" aria-label="Close settings">
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
          <div className="flex justify-end border-t-2 border-ink px-6 py-4">
            <Dialog.Close asChild>
              <Button>Done</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
