"use client";

import { Check, ChevronRight } from "lucide-react";
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

/** Labelled progress remains visible at every screen size. */
export function PipelineSteps({ currentStep }: PipelineStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);
  return (
    <nav aria-label="Import progress">
      <ol className="flex items-center gap-3 sm:gap-5">
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            aria-current={currentStep === step.id ? "step" : undefined}
            className="flex items-center gap-3 sm:gap-5"
          >
            {index > 0 && (
              <ChevronRight
                className="size-3 text-muted-foreground/60"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "flex items-center gap-2 text-xs sm:text-sm",
                index === currentIndex
                  ? "font-semibold text-primary"
                  : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[11px]",
                  index === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : index < currentIndex
                      ? "bg-accent text-primary"
                      : "border bg-card",
                )}
              >
                {index < currentIndex ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {step.label}
              <span className="sr-only">
                {index < currentIndex
                  ? ", complete"
                  : index > currentIndex
                    ? ", upcoming"
                    : ""}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
