"use client";

/**
 * Pipeline step indicator component.
 *
 * Renders the three wizard stages as numbered pills in the app header:
 * Upload → Review → Export. The active step is filled and labelled in the
 * foreground colour; completed steps show a checkmark; upcoming steps are muted.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The three wizard steps. */
export type PipelineStep = "upload" | "review" | "export";

export interface PipelineStepsProps {
  /** The currently active step. */
  currentStep: PipelineStep;
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS: Array<{ id: PipelineStep; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "export", label: "Export" },
];

const STEP_ORDER: PipelineStep[] = ["upload", "review", "export"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Numbered step pills for the wizard pipeline.
 *
 * @param props - See PipelineStepsProps.
 */
export function PipelineSteps({ currentStep }: PipelineStepsProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-1">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.id}>
              <div
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1 text-sm transition-colors sm:px-3",
                  isCurrent && "bg-primary/10 font-medium text-foreground",
                  !isCurrent && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    (isCurrent || isCompleted) && "bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-3" aria-hidden /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
