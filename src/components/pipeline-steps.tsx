"use client";

/**
 * Pipeline step indicator component.
 *
 * Renders a horizontal step indicator showing the three stages of the
 * LunchPrep wizard: Upload → Review → Export. The current step is
 * highlighted; completed steps show a checkmark.
 */

import * as React from "react";
import { Upload, FileSearch, Download, Check } from "lucide-react";
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

interface StepDef {
  id: PipelineStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepDef[] = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "review", label: "Review", icon: FileSearch },
  { id: "export", label: "Export", icon: Download },
];

const STEP_ORDER: PipelineStep[] = ["upload", "review", "export"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Horizontal step indicator for the wizard pipeline.
 *
 * @param props - See PipelineStepsProps.
 */
export function PipelineSteps({ currentStep }: PipelineStepsProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav
      aria-label="Progress"
      className="mb-8"
    >
      <ol className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <li className="flex items-center gap-3">
                {/* Step circle / icon */}
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted-foreground/30 bg-background text-muted-foreground/50",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    <Icon className="size-4" aria-hidden />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-foreground",
                    isCompleted && "text-muted-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground/50",
                  )}
                >
                  {step.label}
                </span>
              </li>

              {/* Connector line between steps */}
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className={cn(
                    "hidden h-px flex-1 sm:mx-4 sm:block",
                    index < currentIndex ? "bg-primary" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
