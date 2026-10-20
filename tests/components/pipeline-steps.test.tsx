import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PipelineSteps, type PipelineStep } from "@/components/pipeline-steps";

afterEach(cleanup);

describe("PipelineSteps", () => {
  it("marks only the current step with aria-current", () => {
    render(<PipelineSteps currentStep="review" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[1].getAttribute("aria-current")).toBe("step");
    expect(items[0].getAttribute("aria-current")).toBeNull();
    expect(items[2].getAttribute("aria-current")).toBeNull();
  });

  it("labels earlier steps complete and later steps upcoming", () => {
    render(<PipelineSteps currentStep="review" />);
    expect(screen.getByText("Upload").parentElement?.textContent).toContain(
      "complete",
    );
    expect(screen.getByText("Export").parentElement?.textContent).toContain(
      "upcoming",
    );
  });

  it("treats the first step as current with nothing complete", () => {
    render(<PipelineSteps currentStep="upload" />);
    expect(document.body.textContent).not.toContain("complete");
  });

  it("falls back to no current step for an unknown value", () => {
    render(<PipelineSteps currentStep={"nope" as PipelineStep} />);
    expect(
      screen.getAllByRole("listitem").some((li) => li.hasAttribute("aria-current")),
    ).toBe(false);
  });

  it("signals in-progress only when busy, on the current step", () => {
    const { rerender } = render(<PipelineSteps currentStep="review" />);
    expect(document.body.textContent).not.toContain("in progress");
    rerender(<PipelineSteps currentStep="review" busy />);
    expect(document.body.textContent).toContain("Review, in progress");
    expect(document.body.textContent).not.toContain("Upload, in progress");
  });
});
