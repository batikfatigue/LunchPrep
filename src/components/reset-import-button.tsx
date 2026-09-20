"use client";

import { AlertDialog } from "radix-ui";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Confirm before discarding the active statement and local review. */
export function ResetImportButton({
  onReset,
  disabled = false,
}: {
  onReset: () => void;
  disabled?: boolean;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost" disabled={disabled}>
          <RotateCcw className="size-3.5" aria-hidden /> Start over
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-xl">
          <AlertDialog.Title className="text-lg font-semibold">
            Start a new import?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            Your current review and edits will be cleared. Download your CSV
            first if you want to keep them.
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Keep reviewing</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button onClick={onReset}>Start new import</Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
