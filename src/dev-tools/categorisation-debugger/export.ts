/**
 * Markdown export utility for the Categorisation Debugger dev tool.
 *
 * Compiles flagged transaction data, Gemini debug payloads, and developer
 * notes into a formatted Markdown string suitable for offline analysis.
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
 * Extract the per-transaction API payload from the raw batch payload.
 *
 * Parses the full Gemini batch JSON, finds the entry matching the given
 * transaction index, and returns a cleaned JSON string (without the
 * internal `index` field). Returns `null` if extraction fails.
 *
 * @param rawPayload - The full JSON batch string sent to Gemini.
 * @param index      - The transaction index to extract.
 * @returns Formatted JSON string or null.
 */
export function extractTransactionPayload(
  rawPayload: string | undefined,
  index: number,
): string | null {
  if (!rawPayload) return null;
  try {
    const fullPayload = JSON.parse(rawPayload);
    const matched = fullPayload.transactions?.find(
      (t: Record<string, unknown>) => t.index === index,
    );
    if (!matched) return null;
    // Reason: Remove `index` — it's an internal routing field, not useful in the report.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { index: _index, ...rest } = matched;
    return JSON.stringify(rest, null, 2);
  } catch {
    return null;
  }
}

/**
 * Compile flagged categorisation debugger data into a Markdown string.
 *
 * Only transactions with a non-empty developer note (annotation) are
 * included. Each entry shows the developer note first, followed by a
 * metadata table, API payload/output code blocks, and AI reasoning.
 *
 * @param transactions - The full transaction list shown in the review step.
 * @param categoryMap  - Map of transaction index → assigned category.
 * @param debugData    - Raw payload and per-transaction reasoning from the API.
 * @param annotations  - User-typed developer notes keyed by transaction index.
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
    "# LunchPrep — Categorisation Debugger Report",
    "",
    `> Generated: ${now}`,
    "",
    "---",
    "",
  ];

  // Collect flagged indices (transactions with a non-empty developer note)
  const flaggedIndices = Array.from(annotations.entries())
    .filter(([, comment]) => comment.trim().length > 0)
    .map(([index]) => index)
    .sort((a, b) => a - b);

  if (flaggedIndices.length === 0) {
    lines.push("*No items were flagged for review.*");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(
    `**${flaggedIndices.length}** of ${transactions.length} transactions flagged for review.`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  let entryNum = 0;
  for (const i of flaggedIndices) {
    const tx = transactions[i];
    if (!tx) continue;

    entryNum++;
    const category = categoryMap.get(i) ?? "(uncategorised)";
    const reasoning =
      debugData?.perTransaction.find((p) => p.index === i)?.reasoning ?? "";
    const comment = annotations.get(i) ?? "";

    // Format date as DD/MM/YYYY
    const d = tx.date;
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    const amountStr = `${tx.amount < 0 ? "−" : "+"}$${Math.abs(tx.amount).toFixed(2)}`;

    // --- Section header ---
    lines.push(`## ${entryNum}. Transaction #${i + 1} — ${dateStr} — ${tx.originalDescription}`);
    lines.push("");

    // --- Developer Note (first) ---
    lines.push("### Developer Note");
    lines.push("");
    lines.push(comment);
    lines.push("");

    // --- Metadata table ---
    lines.push("### Details");
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("| :--- | :--- |");
    lines.push(`| **Date** | ${dateStr} |`);
    lines.push(`| **Raw Description** | ${tx.originalDescription} |`);
    lines.push(`| **Amount** | ${amountStr} |`);
    lines.push(`| **Transaction Code** | \`${tx.transactionCode}\` |`);
    lines.push(`| **Assigned Category** | ${category} |`);
    lines.push(`| **Notes** | ${tx.notes || "—"} |`);
    lines.push("");

    // --- API Payload ---
    const payload = extractTransactionPayload(debugData?.rawPayload, i);
    lines.push("### API Payload");
    lines.push("");
    if (payload) {
      lines.push("```json");
      lines.push(payload);
      lines.push("```");
    } else {
      lines.push("*N/A*");
    }
    lines.push("");

    // --- API Output ---
    lines.push("### API Output");
    lines.push("");
    if (category !== "(uncategorised)") {
      lines.push("```json");
      lines.push(JSON.stringify({ category }, null, 2));
      lines.push("```");
    } else {
      lines.push("*N/A*");
    }
    lines.push("");

    // --- AI Reasoning ---
    lines.push("### AI Reasoning");
    lines.push("");
    if (reasoning) {
      // Wrap each line in blockquote
      for (const rLine of reasoning.split("\n")) {
        lines.push(`> ${rLine}`);
      }
    } else {
      lines.push("*N/A*");
    }
    lines.push("");

    lines.push("---");
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
