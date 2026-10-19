import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Notice } from "@/components/ui/notice";

afterEach(cleanup);

describe("Notice", () => {
  it("announces its message as a polite status", () => {
    render(<Notice>Saved on this device.</Notice>);
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Saved on this device.");
    expect(status.getAttribute("data-tone")).toBe("info");
  });

  it("applies the warning treatment when asked", () => {
    render(<Notice tone="warning">Check your key.</Notice>);
    const status = screen.getByRole("status");
    expect(status.getAttribute("data-tone")).toBe("warning");
    expect(status.className).toContain("border-foreground/60");
  });

  it("merges custom classes and hides its icon from assistive tech", () => {
    render(<Notice className="mt-9">Hello</Notice>);
    const status = screen.getByRole("status");
    expect(status.className).toContain("mt-9");
    expect(status.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
