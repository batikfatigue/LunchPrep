/**
 * Tests for the review pagination page-item builder.
 */

import { describe, it, expect } from "vitest";
import { buildPageItems } from "@/components/review/review-pagination";

describe("buildPageItems", () => {
  it("lists every page when they fit", () => {
    expect(buildPageItems(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("collapses the tail when the user is near the start", () => {
    expect(buildPageItems(0, 12)).toEqual([0, 1, 2, "…", 11]);
  });

  it("collapses both sides in the middle", () => {
    expect(buildPageItems(6, 12)).toEqual([0, "…", 5, 6, 7, "…", 11]);
  });

  it("handles a single page", () => {
    expect(buildPageItems(0, 1)).toEqual([0]);
  });
});
