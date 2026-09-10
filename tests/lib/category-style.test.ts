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

  it("falls back to a neutral tag style for an empty category", () => {
    const style = getCategoryStyle("");
    expect(style.icon).toBe("tag");
    expect(style.className).toContain("slate");
  });
});
