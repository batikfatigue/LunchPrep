"use client";

import { ArrowRight, FileText } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b pb-6">
      <FileText
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium">Pick up where you left off</p>
        <p className="truncate text-sm text-muted-foreground">
          {session.meta.filename}, {session.meta.txnCount} transactions saved on
          this device
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onResume}>
          Resume review
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
