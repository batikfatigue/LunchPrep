"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedSession } from "@/lib/session";

/** Offer the previous local review before starting another import. */
export function ResumeBanner({
  session,
  onResume,
  onDiscard,
}: {
  session: SavedSession;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-cta/30 px-4 py-3 shadow-hard-sm">
      <FileText className="size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Pick up where you left off</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {session.meta.filename}, {session.meta.txnCount} transactions saved on
          this device
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onResume}>
          Resume review
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
