/**
 * Gemini prompt builder for transaction categorisation.
 *
 * Constructs the system instruction and user prompt for the Gemini
 * categorisation request. All functions are pure — no external dependencies,
 * safe to import on both client and server.
 *
 * @see specs/ai-categorisation.md for Gemini config and prompt specification
 */

import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// System instruction
// ---------------------------------------------------------------------------

/**
 * System instruction sent to Gemini as the `systemInstruction` parameter.
 *
 * Establishes Gemini's role, input format expectations, and output constraints.
 * Using systemInstruction (rather than embedding rules in the user prompt)
 * improves reliability for instruction-following models.
 */
export const SYSTEM_INSTRUCTION = `You are an expert financial categoriser for personal expenses in Singapore.
Your job is to assign each transaction exactly one category from the user's provided list.

Rules:
1. Pay attention to the "transactionType" to understand if it's a purchase, transfer, or fee.
2. Consider "notes" which might contain user-provided context or FAST purpose codes.
3. If it looks like a person-to-person transfer (e.g., PayNow to a generic name) and no context is provided, default to "Transfers".
4. Output strict JSON only.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of a single transaction item in the Gemini request payload.
 */
export interface PromptTransaction {
  /** 0-based position of the transaction in the original array. */
  index: number;
  /** Payee/merchant name (must be anonymised before building prompt). */
  payee: string;
  /** Optional user-provided context or FAST purpose code. */
  notes: string;
  /** Full transaction code description (e.g. "Point-of-Sale Transaction or Proceeds"). */
  transactionType: string;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the user-prompt JSON string for a Gemini categorisation request.
 *
 * The returned string is passed directly as the user message. It contains
 * the valid category list and all transactions in a single batch, which
 * minimises API calls and provides Gemini with cross-transaction context.
 *
 * IMPORTANT: Transactions must be anonymised before calling this function.
 * Personal names in ICT/ITR transactions should already be replaced with
 * mock placeholders.
 *
 * @param transactions - Array of RawTransaction (PII must be masked first).
 * @param categories - Category list that constrains Gemini's output choices.
 * @returns Stringified JSON string for the Gemini user prompt.
 */
export function buildPrompt(
  transactions: RawTransaction[],
  categories: string[],
): string {
  const items: PromptTransaction[] = transactions.map((tx, i) => ({
    index: i,
    payee: tx.description,
    notes: tx.notes,
    // Reason: transactionType uses tx.transactionCode (full description) so
    // Gemini has the same human-readable context as shown in the spec examples.
    transactionType: tx.transactionCode,
  }));

  return JSON.stringify(
    {
      valid_categories: categories,
      transactions: items,
    },
    null,
    2,
  );
}
