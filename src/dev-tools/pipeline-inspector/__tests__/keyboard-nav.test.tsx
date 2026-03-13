/**
 * Keyboard navigation tests for PipelineInspector.
 *
 * Covers the A/D/←/→ navigation shortcuts, O/F review shortcuts,
 * boundary conditions, null-selection guard, and suppression when
 * focus is inside a form input.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PipelineInspector from "../index";
import type { PipelineSnapshot } from "@/lib/pipeline-snapshot";
import type { RawTransaction } from "@/lib/parsers/types";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTx(overrides?: Partial<RawTransaction>): RawTransaction {
  return {
    date: new Date("2026-01-15"),
    description: "Test Merchant",
    originalDescription: "TEST MERCHANT",
    amount: -10.5,
    transactionCode: "POS",
    notes: "",
    originalPII: {},
    ...overrides,
  };
}

const SNAPSHOT: PipelineSnapshot = { parsed: [makeTx()] };

/**
 * Renders PipelineInspector and returns tools for testing.
 */
function setup({
  selectedIndex = 1,
  transactionCount = 5,
  categoryMap = new Map<number, string>(),
}: {
  selectedIndex?: number | null;
  transactionCount?: number;
  categoryMap?: ReadonlyMap<number, string>;
} = {}) {
  const onSelectIndex = vi.fn();
  const props = {
    snapshots: SNAPSHOT,
    selectedIndex,
    categories: [],
    apiKey: "",
    categoryMap,
    debugData: null,
    transactionCount,
    onSelectIndex,
  };

  const result = render(<PipelineInspector {...props} />);
  const panel = result.container.querySelector('[tabindex="0"]') as HTMLElement;

  const rerenderWithIndex = (newIndex: number | null) => {
    result.rerender(<PipelineInspector {...props} selectedIndex={newIndex} />);
  };

  return { ...result, panel, onSelectIndex, rerenderWithIndex };
}

// ---------------------------------------------------------------------------
// Navigation shortcuts — D / → (next)
// ---------------------------------------------------------------------------

describe("keyboard navigation — next (D / →)", () => {
  it("D key calls onSelectIndex with selectedIndex + 1", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 1 });
    fireEvent.keyDown(panel, { key: "d" });
    expect(onSelectIndex).toHaveBeenCalledWith(2);
  });

  it("→ key calls onSelectIndex with selectedIndex + 1", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 1 });
    fireEvent.keyDown(panel, { key: "ArrowRight" });
    expect(onSelectIndex).toHaveBeenCalledWith(2);
  });

  it("D is ignored when selectedIndex is at the last transaction", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 4, transactionCount: 5 });
    fireEvent.keyDown(panel, { key: "d" });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });

  it("→ is ignored when selectedIndex is at the last transaction", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 4, transactionCount: 5 });
    fireEvent.keyDown(panel, { key: "ArrowRight" });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Navigation shortcuts — A / ← (prev)
// ---------------------------------------------------------------------------

describe("keyboard navigation — prev (A / ←)", () => {
  it("A key calls onSelectIndex with selectedIndex - 1", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 2 });
    fireEvent.keyDown(panel, { key: "a" });
    expect(onSelectIndex).toHaveBeenCalledWith(1);
  });

  it("← key calls onSelectIndex with selectedIndex - 1", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 2 });
    fireEvent.keyDown(panel, { key: "ArrowLeft" });
    expect(onSelectIndex).toHaveBeenCalledWith(1);
  });

  it("A is ignored when selectedIndex is at the first transaction", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 0 });
    fireEvent.keyDown(panel, { key: "a" });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });

  it("← is ignored when selectedIndex is at the first transaction", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: 0 });
    fireEvent.keyDown(panel, { key: "ArrowLeft" });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Null selection guard
// ---------------------------------------------------------------------------

describe("keyboard navigation — null selection", () => {
  it("all navigation shortcuts have no effect when selectedIndex is null", () => {
    const { panel, onSelectIndex } = setup({ selectedIndex: null });
    fireEvent.keyDown(panel, { key: "d" });
    fireEvent.keyDown(panel, { key: "D" });
    fireEvent.keyDown(panel, { key: "ArrowRight" });
    fireEvent.keyDown(panel, { key: "a" });
    fireEvent.keyDown(panel, { key: "A" });
    fireEvent.keyDown(panel, { key: "ArrowLeft" });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Input suppression
// ---------------------------------------------------------------------------

describe("keyboard shortcuts suppressed inside form inputs", () => {
  it("A/D/←/→ fired on the annotation textarea do not call onSelectIndex", () => {
    // Reason: Render with a categoryMap entry so ReviewControls (and its textarea)
    // are visible. Keys fired on the textarea must not be intercepted by the inspector.
    const { onSelectIndex } = setup({
      selectedIndex: 0,
      categoryMap: new Map([[0, "Food"]]),
      transactionCount: 5,
    });
    const textarea = screen.getByPlaceholderText(/Add a note/);
    fireEvent.keyDown(textarea, { key: "ArrowRight" });
    fireEvent.keyDown(textarea, { key: "ArrowLeft" });
    fireEvent.keyDown(textarea, { key: "d" });
    fireEvent.keyDown(textarea, { key: "a" });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Review shortcuts — O (OK) and F (Flag)
// ---------------------------------------------------------------------------

describe("keyboard review shortcuts — O / F", () => {
  it("O key marks the selected transaction as OK (progress counter updates)", () => {
    // Reason: categoryMap must include selectedIndex for ReviewControls to render.
    setup({ selectedIndex: 0, categoryMap: new Map([[0, "Food"]]), transactionCount: 5 });
    const panel = document.querySelector('[tabindex="0"]') as HTMLElement;

    fireEvent.keyDown(panel, { key: "o" });

    // Progress counter should now show 1 reviewed, 1 ok
    // Reason: getByText throws if the element is absent — no extra assertion needed.
    screen.getByText("1/5 reviewed");
    screen.getByText("1 ok");
  });

  it("F key marks the selected transaction as flagged and enables the note textarea", () => {
    setup({ selectedIndex: 0, categoryMap: new Map([[0, "Food"]]), transactionCount: 5 });
    const panel = document.querySelector('[tabindex="0"]') as HTMLElement;

    fireEvent.keyDown(panel, { key: "f" });

    // Textarea should be enabled after flagging
    const textarea = screen.getByPlaceholderText(/Add a note/);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false);

    // Progress counter should now show 1 reviewed, 1 flagged
    screen.getByText("1/5 reviewed");
    screen.getByText("1 flagged");
  });
});

// ---------------------------------------------------------------------------
// Subset navigation — Q / W (unreviewed) and Shift+Q / Shift+W (flagged)
// ---------------------------------------------------------------------------

describe("keyboard navigation — subset cycling", () => {
  it("W key jumps to the next unreviewed transaction", () => {
    // 0 is unreviewed, 1 is ok, 2 is unreviewed. From 0, W should jump to 2.
    const { panel, onSelectIndex, rerenderWithIndex } = setup({
      selectedIndex: 0,
      categoryMap: new Map([[1, "Food"]]),
      transactionCount: 5,
    });

    // 1. Mark index 1 as OK
    rerenderWithIndex(1);
    fireEvent.keyDown(panel, { key: "o" });

    // 2. Move back to 0
    rerenderWithIndex(0);

    // 3. Press 'w' (find next unreviewed after 0)
    // Results should be 2 because 1 is reviewed.
    fireEvent.keyDown(panel, { key: "w" });
    expect(onSelectIndex).toHaveBeenCalledWith(2);
  });

  it("Shift+W key jumps to the next flagged transaction", () => {
    // Index 3 is flagged. From 0, Shift+W should jump to 3.
    const { panel, onSelectIndex, rerenderWithIndex } = setup({
      selectedIndex: 0,
      categoryMap: new Map([[3, "Food"]]),
      transactionCount: 5,
    });

    // 1. Mark index 3 as flagged
    rerenderWithIndex(3);
    fireEvent.keyDown(panel, { key: "f" });

    // 2. Back to 0
    rerenderWithIndex(0);

    // 3. Press 'Shift+W'
    fireEvent.keyDown(panel, { key: "W", shiftKey: true });
    expect(onSelectIndex).toHaveBeenCalledWith(3);
  });

  it("Q/W/Shift+Q/Shift+W are suppressed inside form inputs", () => {
    const { onSelectIndex } = setup({
      selectedIndex: 0,
      categoryMap: new Map([[0, "Food"]]),
      transactionCount: 5,
    });
    const textarea = screen.getByPlaceholderText(/Add a note/);
    fireEvent.keyDown(textarea, { key: "q" });
    fireEvent.keyDown(textarea, { key: "w" });
    fireEvent.keyDown(textarea, { key: "Q", shiftKey: true });
    fireEvent.keyDown(textarea, { key: "W", shiftKey: true });
    expect(onSelectIndex).not.toHaveBeenCalled();
  });
});
