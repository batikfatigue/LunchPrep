/**
 * Tests for category badge styling resolution.
 */

import { describe, it, expect } from "vitest";
import { getCategoryStyle } from "@/lib/review/category-style";

describe("getCategoryStyle", () => {
  it("matches a known keyword to its icon", () => {
    expect(getCategoryStyle("Groceries").icon).toBe("shopping-basket");
    expect(getCategoryStyle("Dining Out").icon).toBe("utensils");
  });

  it("matches keywords case-insensitively and within longer names", () => {
    expect(getCategoryStyle("public TRANSPORT fares").icon).toBe("bus");
  });

  it("is deterministic for unknown categories", () => {
    expect(getCategoryStyle("Sinking Fund")).toEqual(getCategoryStyle("Sinking Fund"));
  });

  it("falls back to a dashed, muted tag style for an empty category", () => {
    const style = getCategoryStyle("");
    expect(style.icon).toBe("tag");
    expect(style.className).toBe("border-dashed border-input bg-transparent text-ink-mute");
  });

  it("treats a whitespace-only category as empty", () => {
    expect(getCategoryStyle("   ")).toEqual(getCategoryStyle(""));
  });

  it("gives assigned categories a solid hairline pill, distinct from the empty style", () => {
    const empty = getCategoryStyle("");
    for (const name of ["Groceries", "Dining Out", "Sinking Fund"]) {
      const style = getCategoryStyle(name);
      expect(style.className).toBe("bg-card text-foreground border-border");
      expect(style.className).not.toContain("border-dashed");
      expect(style.className).not.toBe(empty.className);
    }
  });
});
