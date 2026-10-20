import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PrepSheet } from "@/components/brand/prep-sheet";
import { CsvPreview } from "@/components/brand/csv-preview";
import { Wordmark } from "@/components/brand/wordmark";

afterEach(cleanup);

describe("brand visuals", () => {
  it("PrepSheet explains the transformation with fictional rows", () => {
    render(<PrepSheet />);
    expect(screen.getByLabelText(/three fictional bank lines/i)).toBeTruthy();
    expect(screen.getByText("Noodle House Stall")).toBeTruthy();
    expect(screen.getByText(/not a real account/i)).toBeTruthy();
  });

  it("CsvPreview lists exactly the five Lunch Money columns", () => {
    const { container } = render(<CsvPreview />);
    const heads = [...container.querySelectorAll("th")].map((th) => th.textContent);
    expect(heads).toEqual(["date", "payee", "amount", "category", "notes"]);
    // Edge: empty notes render as a dash, not a blank cell.
    expect(container.textContent).toContain("–");
  });

  it("Wordmark restores the supplied lunchbox artwork beside the name", () => {
    const { container } = render(<Wordmark />);
    expect(container.textContent).toBe("lunchprep");
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    // next/image rewrites src to /_next/image?url=%2Ficon.png..., so match the asset.
    expect(decodeURIComponent(img?.getAttribute("src") ?? "")).toContain("/icon.png");
    expect(img?.getAttribute("width")).toBe("40");
    expect(container.querySelector("svg")).toBeNull();
    // No forced tile behind the artwork in any theme.
    expect(img?.className).not.toMatch(/bg-|rounded/);
  });

  it("Wordmark accepts a larger icon size for the footer lockup", () => {
    const { container } = render(<Wordmark size={56} />);
    expect(container.querySelector("img")?.getAttribute("height")).toBe("56");
  });
});
