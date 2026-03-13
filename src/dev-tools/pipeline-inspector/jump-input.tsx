"use client";

/**
 * JumpInput — compact number input for the Pipeline Inspector header.
 *
 * Accepts a 1-indexed transaction number, navigates to it on Enter,
 * resets to the current transaction on Escape, and clamps out-of-range
 * values to the valid [1, transactionCount] range.
 *
 * Hidden when no transaction is selected or when sandbox mode is active.
 *
 * Dev-tool only — never imported outside src/dev-tools/.
 */

import * as React from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JumpInputProps {
    /** 0-indexed index of the currently selected transaction (null = no selection). */
    selectedIndex: number | null;
    /** Total number of transactions (defines the valid range). */
    transactionCount: number;
    /** Whether sandbox mode is active (hides the input when true). */
    isSandboxActive: boolean;
    /** Called with a 0-indexed index when the user confirms a jump. */
    onJump: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Compact number input for direct transaction navigation.
 *
 * Accepts 1-indexed values, converts to 0-indexed before calling `onJump`,
 * and clamps values outside the valid range.
 *
 * @param props - See JumpInputProps.
 */
export default function JumpInput({
    selectedIndex,
    transactionCount,
    isSandboxActive,
    onJump,
}: JumpInputProps) {
    const currentIndex = selectedIndex ?? 0;

    // Local state for the controlled input value (1-indexed display).
    const [value, setValue] = React.useState(String(currentIndex + 1));

    // Reason: Keep the input value in sync when selectedIndex changes externally
    // (e.g. A/D navigation) without overriding an in-progress edit on the same transaction.
    const prevIndexRef = React.useRef(currentIndex);
    React.useEffect(() => {
        if (prevIndexRef.current !== currentIndex) {
            prevIndexRef.current = currentIndex;
            setValue(String(currentIndex + 1));
        }
    }, [currentIndex]);

    // Reason: Hidden when sandbox is active or no transaction is selected.
    // Placed after hooks to satisfy the Rules of Hooks.
    if (isSandboxActive || selectedIndex === null) return null;

    /**
     * Clamp a 1-indexed user input to the valid range and return a 0-indexed value.
     *
     * @param raw - The raw numeric value entered by the user.
     * @returns A 0-indexed index clamped to [0, transactionCount - 1].
     */
    function clampToIndex(raw: number): number {
        const clamped = Math.max(1, Math.min(raw, transactionCount));
        return clamped - 1;
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            const parsed = parseInt(value, 10);
            const targetIndex = isNaN(parsed) ? currentIndex : clampToIndex(parsed);
            // Reason: Update the display value to reflect clamped result.
            setValue(String(targetIndex + 1));
            onJump(targetIndex);
            e.currentTarget.blur();
        } else if (e.key === "Escape") {
            e.preventDefault();
            // Reason: Reset to current transaction number and blur.
            setValue(String(currentIndex + 1));
            e.currentTarget.blur();
        }
    }

    return (
        <input
            type="number"
            aria-label="Jump to transaction"
            min={1}
            max={transactionCount}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 w-14 rounded border bg-background px-1.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
    );
}
