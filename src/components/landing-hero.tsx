"use client";

/**
 * LandingHero — Privacy-first hero section displayed above the upload UI.
 *
 * Explains the tool's purpose, privacy model, and 3-step usage instructions.
 * Rendered on the Upload step before users interact with the file input.
 * Uses shadcn/ui Card components and Tailwind CSS only (no inline styles).
 */

import { Shield, Upload, Sparkles, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Sub-component types
// ---------------------------------------------------------------------------

interface StepCardProps {
  /** Step number label (e.g. "1. Upload"). */
  label: string;
  /** Lucide icon component to render inside the icon circle. */
  icon: React.ComponentType<{ className?: string }>;
  /** Short description of what happens in this step. */
  description: string;
}

// ---------------------------------------------------------------------------
// Internal sub-component
// ---------------------------------------------------------------------------

/**
 * A single "how it works" step card with icon, label, and description.
 *
 * @param props - See StepCardProps.
 */
function StepCard({ label, icon: Icon, description }: StepCardProps) {
  return (
    <Card>
      <CardContent className="pt-2 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Icon className="size-5 text-primary" aria-hidden />
          </div>
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

/**
 * Privacy-first landing hero rendered above the file upload UI.
 *
 * Provides new users with an at-a-glance understanding of:
 * - What LunchPrep does (DBS CSV → Lunch Money import)
 * - The privacy-first model (all processing in browser, PII anonymised)
 * - The 3-step workflow (Upload → Review → Export)
 *
 * @returns Hero section as a React element.
 */
export function LandingHero() {
  return (
    <section aria-label="About LunchPrep" className="mb-8 space-y-6">
      {/* Tagline */}
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          DBS → Lunch Money, in under 2 minutes.
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Upload your DBS bank statement CSV. LunchPrep uses Gemini AI to
          categorise every transaction, then exports a file ready to import
          directly into{" "}
          <a
            href="https://lunchmoney.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Lunch Money
          </a>
          .
        </p>
      </div>

      {/* Privacy First callout */}
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
        <Shield
          className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400"
          aria-hidden
        />
        <div>
          <p className="font-semibold text-green-800 dark:text-green-300">
            Privacy First — your data never leaves your browser.
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            CSV parsing and all financial data processing happens entirely
            client-side. Before any AI call, real names and account numbers are
            replaced with realistic placeholders — your original data is
            restored locally before export. You can also bring your own Gemini
            API key (BYOK) to bypass the shared proxy entirely.
          </p>
        </div>
      </div>

      {/* 3-step how it works */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StepCard
          label="1. Upload"
          icon={Upload}
          description="Export your DBS statement as a CSV from internet banking and drop it here."
        />
        <StepCard
          label="2. Review"
          icon={Sparkles}
          description="Gemini AI categorises every transaction. Edit payees, notes, or categories inline."
        />
        <StepCard
          label="3. Export"
          icon={Download}
          description="Download a Lunch Money-compatible CSV and import it in one click."
        />
      </div>
    </section>
  );
}
