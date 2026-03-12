/**
 * Pipeline snapshot types for the dev-tools pipeline inspector.
 *
 * Captures transaction state at each named stage of the anonymisation pipeline.
 * Lives in `src/lib/` so both `page.tsx` and the dev-tool component can import
 * it without a cross-boundary dependency.
 */

import type { RawTransaction } from "@/lib/parsers/types";

/**
 * Shape of a single entry in the Gemini request payload.
 * Used for the `sent` stage — distinct from `RawTransaction` to accurately
 * reflect what left the browser.
 */
export interface GeminiSentEntry {
  /** 0-based position of the transaction in the original array. */
  index: number;
  /** Payee/merchant name (anonymised). */
  payee: string;
  /** Optional user-provided context or FAST purpose code. */
  notes: string;
  /** Full transaction code description. */
  transactionType: string;
}

/**
 * Captures transaction state at each named pipeline stage.
 *
 * All keys are optional — absent keys indicate the stage has not yet run.
 * The `sent` stage uses `GeminiSentEntry[]` (Gemini payload shape) rather
 * than `RawTransaction[]` to honestly represent what was sent to the API.
 */
export interface PipelineSnapshot {
  /** Transactions after CSV parsing. */
  parsed?: RawTransaction[];
  /** Transactions after PII anonymisation. */
  anonymised?: RawTransaction[];
  /** Gemini request payload shape — what was actually sent. */
  sent?: GeminiSentEntry[];
  /** Transactions after AI categorisation (before PII restore). */
  categorised?: RawTransaction[];
  /** Transactions after PII restoration. */
  restored?: RawTransaction[];
}
