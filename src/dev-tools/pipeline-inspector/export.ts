/**
 * Markdown export utility for the Pipeline Inspector dev tool.
 *
 * Compiles flagged transaction data, Gemini debug payloads, and developer
 * notes into a formatted Markdown string suitable for offline analysis.
 *
 * Adapted from src/dev-tools/categorisation-debugger/export.ts to accept
 * the new ReviewStatus model (flagged-only export, no bare annotation strings).
 *
 * Dev-tool only — never imported outside src/dev-tools/.
 */

import type { RawTransaction } from "@/lib/parsers/types";
import type { DebugData } from "@/lib/categoriser/client";
import type { ReviewStatus } from "@/dev-tools/pipeline-inspector/review-controls";

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
 * Compile flagged pipeline inspector review data into a Markdown string.
 *
 * Only transactions with review status "flagged" are included. Each entry
 * shows the developer note first, followed by a metadata table, API
 * payload/output code blocks, and AI reasoning.
 *
 * @param transactions - The full transaction list.
 * @param categoryMap  - Map of transaction index → assigned category.
 * @param debugData    - Raw payload and per-transaction reasoning from the API.
 * @param reviewMap    - Review state keyed by transaction index.
 * @returns Formatted Markdown string for download.
 */
export function buildReviewMarkdown(
  transactions: RawTransaction[],
  categoryMap: ReadonlyMap<number, string>,
  debugData: DebugData | null,
  reviewMap: ReadonlyMap<number, ReviewStatus>,
): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    "# LunchPrep — Pipeline Inspector Review Report",
    "",
    `> Generated: ${now}`,
    "",
    "---",
    "",
  ];

  // Collect flagged indices only
  const flaggedEntries = Array.from(reviewMap.entries())
    .filter(([, s]) => s.status === "flagged")
    .sort(([a], [b]) => a - b);

  if (flaggedEntries.length === 0) {
    lines.push("*No items were flagged for review.*");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(
    `**${flaggedEntries.length}** of ${transactions.length} transactions flagged for review.`,
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  let entryNum = 0;
  for (const [i, reviewStatus] of flaggedEntries) {
    const tx = transactions[i];
    if (!tx) continue;

    entryNum++;
    const category = categoryMap.get(i) ?? "(uncategorised)";
    const reasoning =
      debugData?.perTransaction.find((p) => p.index === i)?.reasoning ?? "";
    const note = reviewStatus.note;

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
    lines.push(note || "*(no note)*");
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
  a.download = `lunchprep-review-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
