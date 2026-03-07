import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(cleanup);
import { CategoryEditor, reorderCategories } from "@/components/category-editor";

// ---------------------------------------------------------------------------
// reorderCategories — pure helper unit tests
// ---------------------------------------------------------------------------

describe("reorderCategories", () => {
  const cats = ["Dining", "Transport", "Groceries", "Shopping"];

  it("returns reordered array when item moves to a new position", () => {
    // Move "Dining" (index 0) to where "Groceries" (index 2) is
    const result = reorderCategories(cats, "Dining", "Groceries");
    expect(result).toEqual(["Transport", "Groceries", "Dining", "Shopping"]);
  });

  it("returns null when active and over are the same (no-op)", () => {
    expect(reorderCategories(cats, "Dining", "Dining")).toBeNull();
  });

  it("returns null when activeId is not in the list", () => {
    expect(reorderCategories(cats, "Unknown", "Dining")).toBeNull();
  });

  it("returns null when overId is not in the list", () => {
    expect(reorderCategories(cats, "Dining", "Unknown")).toBeNull();
  });

  it("handles moving the last item to the first position", () => {
    const result = reorderCategories(cats, "Shopping", "Dining");
    expect(result?.[0]).toBe("Shopping");
    expect(result).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// CategoryEditor — component render tests
// ---------------------------------------------------------------------------

const defaultCategories = ["Dining", "Transport", "Groceries"];

function setup(overrides: Partial<Parameters<typeof CategoryEditor>[0]> = {}) {
  const onCategoriesChange = vi.fn();
  const { unmount } = render(
    <CategoryEditor
      categories={defaultCategories}
      onCategoriesChange={onCategoriesChange}
      {...overrides}
    />
  );
  return { onCategoriesChange, unmount };
}

describe("CategoryEditor — drag handles", () => {
  it("renders a drag handle for each category row", () => {
    setup();
    // Each row should have a button with aria-label matching drag pattern
    const handles = screen.getAllByRole("button", { name: /Drag to reorder/i });
    expect(handles).toHaveLength(defaultCategories.length);
  });

  it("does NOT render chevron up/down buttons", () => {
    setup();
    // ChevronUp/ChevronDown buttons had aria-labels like 'Move "X" up/down'
    expect(screen.queryByRole("button", { name: /Move .* up/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Move .* down/i })).toBeNull();
  });

  it("drag handle aria-label includes the category name", () => {
    setup();
    expect(
      screen.getByRole("button", { name: /Drag to reorder "Dining"/i })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Drag to reorder "Transport"/i })
    ).toBeTruthy();
  });
});

describe("CategoryEditor — add", () => {
  it("calls onCategoriesChange with new category appended", () => {
    const { onCategoriesChange } = setup();
    const input = screen.getByRole("textbox", { name: /New category name/i });
    fireEvent.change(input, { target: { value: "Entertainment" } });
    fireEvent.click(screen.getByRole("button", { name: /Add category/i }));
    expect(onCategoriesChange).toHaveBeenCalledWith([
      ...defaultCategories,
      "Entertainment",
    ]);
  });

  it("shows an error and does not call onCategoriesChange for duplicate", () => {
    const { onCategoriesChange } = setup();
    const input = screen.getByRole("textbox", { name: /New category name/i });
    fireEvent.change(input, { target: { value: "dining" } }); // case-insensitive duplicate
    fireEvent.click(screen.getByRole("button", { name: /Add category/i }));
    expect(onCategoriesChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("shows an error for empty input", () => {
    const { onCategoriesChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Add category/i }));
    expect(onCategoriesChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

describe("CategoryEditor — remove", () => {
  it("calls onCategoriesChange without the removed category", () => {
    const { onCategoriesChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Remove "Dining"/i }));
    expect(onCategoriesChange).toHaveBeenCalledWith(["Transport", "Groceries"]);
  });
});

describe("CategoryEditor — reset", () => {
  it("calls onCategoriesChange with DEFAULT_CATEGORIES", () => {
    const { onCategoriesChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Reset categories to defaults/i }));
    // Should have been called with the default list (we just check it was called)
    expect(onCategoriesChange).toHaveBeenCalledTimes(1);
    const called = onCategoriesChange.mock.calls[0][0] as string[];
    expect(Array.isArray(called)).toBe(true);
    expect(called.length).toBeGreaterThan(0);
  });
});
