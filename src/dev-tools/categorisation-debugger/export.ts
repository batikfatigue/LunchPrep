/**
 * Markdown export utility for the Categorisation Debugger dev tool.
 *
 * Compiles transaction data, Gemini debug payloads, and user annotations into
 * a formatted Markdown string suitable for offline analysis.
 *
 * Dev-tool only — never imported outside src/dev-tools/.
 */

import type { RawTransaction } from "@/lib/parsers/types";
import type { DebugData } from "@/lib/categoriser/client";

/** Shape of a single transaction's annotation state. */
export interface AnnotationEntry {
  index: number;
  comment: string;
}

/**
 * Compile all categorisation debugger data into a Markdown string.
 *
 * @param transactions - The full transaction list shown in the review step.
 * @param categoryMap  - Map of transaction index → assigned category.
 * @param debugData    - Raw payload and per-transaction reasoning from the API.
 * @param annotations  - User-typed comments keyed by transaction index.
 * @returns Formatted Markdown string for download.
 */
export function buildReviewMarkdown(
  transactions: RawTransaction[],
  categoryMap: ReadonlyMap<number, string>,
  debugData: DebugData | null,
  annotations: Map<number, string>,
): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    "# LunchPrep — Categorisation Debugger",
    "",
    `Generated: ${now}`,
    "",
    "---",
    "",
  ];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const category = categoryMap.get(i) ?? "(uncategorised)";
    const reasoning =
      debugData?.perTransaction.find((p) => p.index === i)?.reasoning ?? "";
    const comment = annotations.get(i) ?? "";

    // Format date as DD/MM/YYYY
    const d = tx.date;
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    lines.push(`## Transaction ${i + 1} — ${dateStr}`);
    lines.push("");
    lines.push(`**Payee:** ${tx.description}`);
    lines.push(
      `**Amount:** ${tx.amount < 0 ? "-" : "+"}$${Math.abs(tx.amount).toFixed(2)}`,
    );
    lines.push(`**Assigned Category:** ${category}`);

    if (tx.notes) {
      lines.push(`**Notes:** ${tx.notes}`);
    }

    if (reasoning) {
      lines.push("");
      lines.push("### AI Reasoning");
      lines.push("");
      lines.push(reasoning);
    }

    if (comment) {
      lines.push("");
      lines.push("### Annotation");
      lines.push("");
      lines.push(comment);
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  if (debugData?.rawPayload) {
    lines.push("## Raw API Payload");
    lines.push("");
    lines.push("The full JSON batch sent to Gemini for this session:");
    lines.push("");
    lines.push("```json");
    lines.push(debugData.rawPayload);
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Trigger a browser file download for the compiled Markdown review.
 *
 * @param markdown - Compiled Markdown string from buildReviewMarkdown.
 */
export function downloadReviewMarkdown(markdown: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lunchprep-categorisation-debug-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
