"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/dev-tools/pipeline-inspector/review-controls";
import type { PipelineSnapshot } from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";

interface FlagSummaryOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    reviewMap: ReadonlyMap<number, ReviewStatus>;
    snapshots: PipelineSnapshot;
    onSelect: (index: number) => void;
}

/**
 * Flag Summary Overlay — dev tool component for viewing all flagged transactions.
 *
 * Provides a consolidated tabular view of transactions marked with "flagged" status.
 * Clicking a row closes the overlay and jumps the inspector to that transaction index.
 */
export default function FlagSummaryOverlay({
    isOpen,
    onClose,
    reviewMap,
    snapshots,
    onSelect,
}: FlagSummaryOverlayProps) {
    // Handle Escape key to close
    React.useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const txs = (snapshots.restored ?? snapshots.parsed ?? []) as RawTransaction[];

    // Deriving flagged items
    const flaggedItems = Array.from(reviewMap.entries())
        .filter(([, status]) => status.status === "flagged")
        .map(([index, status]) => {
            const tx = txs[index];
            return {
                index,
                description: tx?.description ?? "Unknown",
                note: status.note,
            };
        })
        .sort((a, b) => a.index - b.index);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative flex h-[80vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Flag Summary</h2>
                        <p className="text-sm text-muted-foreground">
                            {flaggedItems.length} flagged transactions
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto">
                    {flaggedItems.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-muted-foreground">
                            <p>No transactions have been flagged yet.</p>
                            <p className="text-xs">Press 'F' while inspecting a transaction to flag it.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="sticky top-0 bg-muted/50 backdrop-blur-md">
                                <tr className="border-b">
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Index</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Raw Description</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {flaggedItems.map((item) => (
                                    <tr
                                        key={item.index}
                                        onClick={() => {
                                            onSelect(item.index);
                                            onClose();
                                        }}
                                        className="group cursor-pointer hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-muted-foreground">
                                            #{item.index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {item.description}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground italic">
                                            {item.note || "No note added"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t bg-muted/20 px-6 py-3 text-[10px] text-muted-foreground/60 flex justify-between uppercase tracking-widest">
                    <span>Click a row to jump to transaction</span>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    );
}
