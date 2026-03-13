/**
 * Unit tests for jump-input.tsx.
 *
 * Covers: valid input, out-of-range clamping, Escape reset,
 * hidden in sandbox mode, and hidden when no selection.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import JumpInput from "../jump-input";

afterEach(cleanup);

describe("JumpInput", () => {
    it("renders the current transaction number (1-indexed)", () => {
        render(
            <JumpInput
                selectedIndex={4}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        const input = screen.getByLabelText("Jump to transaction") as HTMLInputElement;
        expect(input.value).toBe("5");
    });

    it("calls onJump with 0-indexed index on Enter", () => {
        const onJump = vi.fn();
        render(
            <JumpInput
                selectedIndex={0}
                transactionCount={50}
                isSandboxActive={false}
                onJump={onJump}
            />
        );
        const input = screen.getByLabelText("Jump to transaction");

        // Type 15 (1-indexed)
        fireEvent.change(input, { target: { value: "15" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onJump).toHaveBeenCalledWith(14); // 0-indexed
    });

    it("clamps values too high to transactionCount", () => {
        const onJump = vi.fn();
        render(
            <JumpInput
                selectedIndex={0}
                transactionCount={50}
                isSandboxActive={false}
                onJump={onJump}
            />
        );
        const input = screen.getByLabelText("Jump to transaction");

        // Type 999
        fireEvent.change(input, { target: { value: "999" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onJump).toHaveBeenCalledWith(49); // last transaction
        expect((input as HTMLInputElement).value).toBe("50");
    });

    it("clamps values too low to 1", () => {
        const onJump = vi.fn();
        render(
            <JumpInput
                selectedIndex={10}
                transactionCount={50}
                isSandboxActive={false}
                onJump={onJump}
            />
        );
        const input = screen.getByLabelText("Jump to transaction");

        // Type 0
        fireEvent.change(input, { target: { value: "0" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(onJump).toHaveBeenCalledWith(0); // first transaction
        expect((input as HTMLInputElement).value).toBe("1");
    });

    it("resets to current index on Escape", () => {
        render(
            <JumpInput
                selectedIndex={4}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        const input = screen.getByLabelText("Jump to transaction") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "9" } });
        expect(input.value).toBe("9");

        fireEvent.keyDown(input, { key: "Escape" });
        expect(input.value).toBe("5");
    });

    it("returns null (renders nothing) when isSandboxActive is true", () => {
        const { container } = render(
            <JumpInput
                selectedIndex={0}
                transactionCount={10}
                isSandboxActive={true}
                onJump={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it("returns null (renders nothing) when selectedIndex is null", () => {
        const { container } = render(
            <JumpInput
                selectedIndex={null}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders the input when selectedIndex transitions from null to a valid index", () => {
        const { rerender } = render(
            <JumpInput
                selectedIndex={null}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        expect(screen.queryByLabelText("Jump to transaction")).toBeNull();

        rerender(
            <JumpInput
                selectedIndex={3}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        const input = screen.getByLabelText("Jump to transaction") as HTMLInputElement;
        expect(input.value).toBe("4");
    });

    it("updates local state when selectedIndex prop changes externally", () => {
        const { rerender } = render(
            <JumpInput
                selectedIndex={0}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        const input = screen.getByLabelText("Jump to transaction") as HTMLInputElement;
        expect(input.value).toBe("1");

        rerender(
            <JumpInput
                selectedIndex={5}
                transactionCount={10}
                isSandboxActive={false}
                onJump={vi.fn()}
            />
        );
        expect(input.value).toBe("6");
    });
});
