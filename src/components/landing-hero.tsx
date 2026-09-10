"use client";

/**
 * LandingHero — headline and pipeline diagram shown at the top of the upload step.
 *
 * Communicates the whole product in one glance: a DBS statement goes in,
 * LunchPrep categorises it in the browser, and a Lunch Money-ready file
 * comes out.
 */

import * as React from "react";
import { ArrowRight, FileText, Leaf } from "lucide-react";

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

interface FlowNodeProps {
  /** Icon rendered in the node's tile. */
  icon: React.ReactNode;
  /** Node title, e.g. "LunchPrep". */
  label: string;
  /** One-line description under the title. */
  caption: string;
}

/**
 * A single node of the DBS → LunchPrep → Lunch Money diagram.
 *
 * @param props - See FlowNodeProps.
 */
function FlowNode({ icon, label, caption }: FlowNodeProps) {
  return (
    <div className="flex w-28 flex-col items-center gap-2 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

/**
 * Upload-step hero with headline, sub-headline and the three-node flow diagram.
 *
 * @returns Hero section as a React element.
 */
export function LandingHero() {
  return (
    <section aria-label="About LunchPrep" className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          Prepare your DBS statements
          <br className="hidden sm:block" /> for Lunch Money
        </h1>
        <p className="mt-2 text-muted-foreground">
          Parse, categorise and export — all in your browser.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2 sm:gap-4">
        <FlowNode
          icon={
            <span className="flex size-8 items-center justify-center rounded-md bg-red-600 text-xs font-bold text-white">
              DBS
            </span>
          }
          label="DBS"
          caption="CSV statement"
        />
        <ArrowRight
          className="mt-4 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <FlowNode
          icon={<FileText className="size-6 text-primary" aria-hidden />}
          label="LunchPrep"
          caption="AI categorisation"
        />
        <ArrowRight
          className="mt-4 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <FlowNode
          icon={<Leaf className="size-6 text-emerald-600" aria-hidden />}
          label="Lunch Money"
          caption="Ready to import"
        />
      </div>
    </section>
  );
}
