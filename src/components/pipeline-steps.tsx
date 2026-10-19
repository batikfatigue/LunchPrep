"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = "upload" | "review" | "export";
export interface PipelineStepsProps {
  currentStep: PipelineStep;
}

const STEPS: Array<{ id: PipelineStep; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "export", label: "Export" },
];

/** Segmented, always-labelled progress. The current step wears the yellow. */
export function PipelineSteps({ currentStep }: PipelineStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);
  return (
    <nav aria-label="Import progress">
      <ol className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-card p-1">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-xs font-semibold transition-colors sm:text-sm",
                isCurrent
                  ? "bg-cta text-cta-foreground"
                  : isDone
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "tabular flex size-6 items-center justify-center rounded-full text-[11px]",
                  isCurrent
                    ? "bg-foreground text-background"
                    : isDone
                      ? "bg-primary text-primary-foreground"
                      : "border border-input",
                )}
              >
                {isDone ? (
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {step.label}
              <span className="sr-only">
                {isDone ? ", complete" : index > currentIndex ? ", upcoming" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
