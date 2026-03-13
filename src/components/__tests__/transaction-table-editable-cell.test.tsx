/**
 * Tests for EditableCell click suppression behaviour in TransactionTable.
 *
 * Verifies that clicking on EditableCell elements (payee/notes) does not trigger
 * the row's onRowSelect handler, and that the blur-then-click refractory mechanism
 * suppresses the follow-up row click after an inline edit is committed.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TransactionTable } from "../transaction-table";
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

/**
 * Render a TransactionTable with a single transaction and editable cells enabled.
 *
 * @param onRowSelect - Spy to inject as the onRowSelect prop.
 * @returns The `onRowSelect` spy and the `<tr>` element for the data row.
 */
function setup(onRowSelect = vi.fn()) {
  const { container } = render(
    <TransactionTable
      transactions={[makeTx()]}
      categories={[]}
      categoryMap={new Map()}
      status="idle"
      onCategoryChange={vi.fn()}
      onPayeeChange={vi.fn()}
      onNotesChange={vi.fn()}
      onRowSelect={onRowSelect}
    />,
  );
  // Reason: target the tbody row directly since <tr> has no accessible name.
  const dataRow = container.querySelector("tbody tr") as HTMLElement;
  return { onRowSelect, dataRow };
}

// ---------------------------------------------------------------------------
// 3.1 & 3.2 — EditableCell click isolation (stopPropagation)
// ---------------------------------------------------------------------------

describe("EditableCell click isolation", () => {
  it("3.1: clicking an EditableCell to enter edit mode does not call onRowSelect", () => {
    const { onRowSelect } = setup();
    // Two editable cells (payee, notes) both have this title.
    const [payeeSpan] = screen.getAllByTitle("Click to edit");
    fireEvent.click(payeeSpan);
    expect(onRowSelect).not.toHaveBeenCalled();
  });

  it("3.2: clicking inside an active EditableCell input does not call onRowSelect", () => {
    const { onRowSelect } = setup();
    const [payeeSpan] = screen.getAllByTitle("Click to edit");
    fireEvent.click(payeeSpan);
    // After entering edit mode the span is replaced by a text input.
    const input = screen.getByRole("textbox");
    fireEvent.click(input);
    expect(onRowSelect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 3.3 & 3.4 — Blur-then-click suppression (refractory ref)
// ---------------------------------------------------------------------------

describe("Blur-then-click suppression", () => {
  beforeEach(() => {
    // Reason: freeze timers so the setTimeout(0) in handleEditEnd does not fire
    // automatically, letting us assert on the refractory window.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("3.3: clicking the row immediately after EditableCell blur does not call onRowSelect", () => {
    const { onRowSelect, dataRow } = setup();
    const [payeeSpan] = screen.getAllByTitle("Click to edit");
    fireEvent.click(payeeSpan);
    const input = screen.getByRole("textbox");
    // Blur simulates clicking elsewhere on the row to dismiss the input.
    fireEvent.blur(input);
    // Click the row before setTimeout(0) fires — refractory flag is still true.
    fireEvent.click(dataRow);
    expect(onRowSelect).not.toHaveBeenCalled();
  });

  it("3.4: clicking the row when no EditableCell is editing calls onRowSelect normally", () => {
    const { onRowSelect, dataRow } = setup();
    fireEvent.click(dataRow);
    expect(onRowSelect).toHaveBeenCalledWith(0);
  });
});
