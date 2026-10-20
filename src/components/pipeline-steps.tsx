"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = "upload" | "review" | "export";
export interface PipelineStepsProps {
  currentStep: PipelineStep;
  /** True only while parsing or categorising is really running. */
  busy?: boolean;
}

const STEPS: Array<{ id: PipelineStep; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "export", label: "Export" },
];

/**
 * Workbench status strip: three mono stations joined by a hairline. The current
 * step sits on the marker, finished steps carry a check, upcoming steps are
 * muted. While work is genuinely running the current step shows a pulsing dot
 * plus a screen-reader "in progress"; it is never animated otherwise.
 *
 * @param {PipelineStepsProps} props - The step currently shown and whether work is running.
 * @returns {JSX.Element} A labelled progress list.
 */
export function PipelineSteps({ currentStep, busy = false }: PipelineStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);
  return (
    <nav aria-label="Import progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2 sm:gap-3"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-4 transition-colors duration-300 sm:w-7",
                    isDone || isCurrent ? "bg-foreground" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "label flex items-center gap-1.5 rounded-[2px] px-2 py-1.5 transition-colors duration-200",
                  isCurrent && "bg-marker !text-marker-foreground",
                  isDone && "!text-foreground",
                )}
              >
                {isDone && (
                  <Check className="size-3 text-ok" strokeWidth={3} aria-hidden />
                )}
                {isCurrent && busy && (
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-current"
                    style={{ animation: "busy-pulse 1s ease-in-out infinite" }}
                  />
                )}
                {step.label}
                <span className="sr-only">
                  {isDone
                    ? ", complete"
                    : index > currentIndex
                      ? ", upcoming"
                      : busy
                        ? ", in progress"
                        : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
