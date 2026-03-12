/**
 * Unit tests for ReviewControls component.
 *
 * Tests review state transitions: unreviewed → OK, unreviewed → flagged,
 * OK ↔ flagged, and progress counter accuracy.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ReviewControls, { type ReviewStatus } from "../review-controls";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderControls(
  reviewMap: Map<number, ReviewStatus>,
  onReviewChange = vi.fn(),
  onExport = vi.fn(),
  selectedIndex = 0,
  totalCount = 5,
) {
  return render(
    <ReviewControls
      selectedIndex={selectedIndex}
      reviewMap={reviewMap}
      totalCount={totalCount}
      onReviewChange={onReviewChange}
      onExport={onExport}
    />,
  );
}

// ---------------------------------------------------------------------------
// Review state transitions
// ---------------------------------------------------------------------------

describe("review state transitions — unreviewed → OK", () => {
  it("calls onReviewChange with { status: 'ok', note: '' } when OK is clicked", () => {
    const onReviewChange = vi.fn();
    renderControls(new Map(), onReviewChange);
    fireEvent.click(screen.getByText("OK"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "ok", note: "" });
  });
});

describe("review state transitions — unreviewed → flagged", () => {
  it("calls onReviewChange with { status: 'flagged', note: '' } when Flag is clicked", () => {
    const onReviewChange = vi.fn();
    renderControls(new Map(), onReviewChange);
    fireEvent.click(screen.getByText("Flag"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "flagged", note: "" });
  });
});

describe("review state transitions — OK → flagged", () => {
  it("calls onReviewChange with flagged (preserving note) when Flag is clicked on an OK transaction", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([[0, { status: "ok", note: "my note" }]]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("Flag"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "flagged", note: "my note" });
  });
});

describe("review state transitions — flagged → OK", () => {
  it("calls onReviewChange with ok (preserving note) when OK is clicked on a flagged transaction", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "something" }],
    ]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("OK"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "ok", note: "something" });
  });
});

describe("review state transitions — OK → neutral (toggle off with note)", () => {
  it("calls onReviewChange with { status: 'neutral', note } when OK is toggled off and a note exists", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([[0, { status: "ok", note: "saved note" }]]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("OK"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "neutral", note: "saved note" });
  });
});

describe("review state transitions — OK → unreviewed (toggle off, no note)", () => {
  it("calls onReviewChange with null when OK is toggled off and there is no note", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([[0, { status: "ok", note: "" }]]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("OK"));
    expect(onReviewChange).toHaveBeenCalledWith(0, null);
  });
});

describe("review state transitions — flagged → neutral (toggle off with note)", () => {
  it("calls onReviewChange with { status: 'neutral', note } when Flag is toggled off and a note exists", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "my note" }],
    ]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("Flag"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "neutral", note: "my note" });
  });
});

describe("review state transitions — flagged → unreviewed (toggle off, no note)", () => {
  it("calls onReviewChange with null when Flag is toggled off and there is no note", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "" }],
    ]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("Flag"));
    expect(onReviewChange).toHaveBeenCalledWith(0, null);
  });
});

// ---------------------------------------------------------------------------
// Note textarea
// ---------------------------------------------------------------------------

describe("note textarea", () => {
  it("is disabled when unreviewed", () => {
    renderControls(new Map());
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
  });

  it("is disabled when status is ok but preserves note text", () => {
    const reviewMap = new Map<number, ReviewStatus>([[0, { status: "ok", note: "ok note" }]]);
    renderControls(reviewMap);
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
    expect((textarea as HTMLTextAreaElement).value).toBe("ok note");
  });

  it("is enabled and shows note when status is flagged", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "my note" }],
    ]);
    renderControls(reviewMap);
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false);
    expect((textarea as HTMLTextAreaElement).value).toBe("my note");
  });

  it("calls onReviewChange with updated note on input when flagged", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "" }],
    ]);
    renderControls(reviewMap, onReviewChange);
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    fireEvent.change(textarea, { target: { value: "new note" } });
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "flagged", note: "new note" });
  });

  it("is disabled when status is neutral but preserves note text", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "neutral", note: "preserved note" }],
    ]);
    renderControls(reviewMap);
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
    expect((textarea as HTMLTextAreaElement).value).toBe("preserved note");
  });

  it("preserves note when switching from flagged to ok", () => {
    const onReviewChange = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "flagged", note: "my note" }],
    ]);
    renderControls(reviewMap, onReviewChange);
    fireEvent.click(screen.getByText("OK"));
    expect(onReviewChange).toHaveBeenCalledWith(0, { status: "ok", note: "my note" });
  });
});

// ---------------------------------------------------------------------------
// Annotation exit (Enter key)
// ---------------------------------------------------------------------------

describe("annotation textarea — Enter key", () => {
  function renderWithExit(
    reviewMap: Map<number, ReviewStatus>,
    onExitAnnotation: () => void,
  ) {
    return render(
      <ReviewControls
        selectedIndex={0}
        reviewMap={reviewMap}
        totalCount={5}
        onReviewChange={vi.fn()}
        onExport={vi.fn()}
        onExitAnnotation={onExitAnnotation}
      />,
    );
  }

  it("calls onExitAnnotation when Enter is pressed in the textarea", () => {
    const onExitAnnotation = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([[0, { status: "flagged", note: "" }]]);
    renderWithExit(reviewMap, onExitAnnotation);
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onExitAnnotation).toHaveBeenCalledOnce();
  });

  it("does not call onExitAnnotation when Shift+Enter is pressed", () => {
    const onExitAnnotation = vi.fn();
    const reviewMap = new Map<number, ReviewStatus>([[0, { status: "flagged", note: "" }]]);
    renderWithExit(reviewMap, onExitAnnotation);
    const textarea = screen.getByPlaceholderText(/Add a note about this transaction/);
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onExitAnnotation).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Progress counter
// ---------------------------------------------------------------------------

describe("progress counter", () => {
  it("shows 0/5 reviewed and zero ok/flagged when no transactions reviewed", () => {
    renderControls(new Map(), vi.fn(), vi.fn(), 0, 5);
    expect(screen.getByText("0/5 reviewed")).toBeDefined();
    expect(screen.getByText("0 ok")).toBeDefined();
    expect(screen.getByText("0 flagged")).toBeDefined();
  });

  it("shows correct count of OK + flagged combined with breakdown", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "ok", note: "" }],
      [1, { status: "flagged", note: "issue" }],
      [2, { status: "ok", note: "" }],
    ]);
    renderControls(reviewMap, vi.fn(), vi.fn(), 0, 10);
    expect(screen.getByText("3/10 reviewed")).toBeDefined();
    expect(screen.getByText("2 ok")).toBeDefined();
    expect(screen.getByText("1 flagged")).toBeDefined();
  });

  it("does not count neutral entries toward the reviewed total", () => {
    const reviewMap = new Map<number, ReviewStatus>([
      [0, { status: "ok", note: "" }],
      [1, { status: "neutral", note: "leftover note" }],
      [2, { status: "flagged", note: "issue" }],
    ]);
    renderControls(reviewMap, vi.fn(), vi.fn(), 0, 10);
    expect(screen.getByText("2/10 reviewed")).toBeDefined();
    expect(screen.getByText("1 ok")).toBeDefined();
    expect(screen.getByText("1 flagged")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Export button
// ---------------------------------------------------------------------------

describe("export button", () => {
  it("calls onExport when clicked", () => {
    const onExport = vi.fn();
    renderControls(new Map(), vi.fn(), onExport);
    fireEvent.click(screen.getByText("Export flagged"));
    expect(onExport).toHaveBeenCalledOnce();
  });
});
