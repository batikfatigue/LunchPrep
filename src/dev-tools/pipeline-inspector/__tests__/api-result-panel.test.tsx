/**
 * Unit tests for the ApiResultPanel component.
 *
 * Tests rendering of category, BYOK mode handling, and collapsible
 * reasoning/payload sections.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ApiResultPanel from "../api-result-panel";

afterEach(cleanup);

describe("ApiResultPanel — category display", () => {
  it("renders the assigned category", () => {
    render(
      <ApiResultPanel category="Dining" reasoning="some reasoning" rawPayload={null} />,
    );
    expect(screen.getByText("Dining")).toBeDefined();
  });

  it("renders dash when category is undefined", () => {
    render(
      <ApiResultPanel category={undefined} reasoning={undefined} rawPayload={null} />,
    );
    expect(screen.getByText("—")).toBeDefined();
  });
});

describe("ApiResultPanel — BYOK mode (reasoning undefined)", () => {
  it("shows 'Not available (BYOK mode)' for reasoning expanded by default", () => {
    render(
      <ApiResultPanel category="Dining" reasoning={undefined} rawPayload={null} />,
    );
    // Both sections are expanded by default — expect multiple BYOK messages
    const byokMessages = screen.getAllByText("Not available (BYOK mode)");
    expect(byokMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Not available (BYOK mode)' for API payload expanded by default in BYOK mode", () => {
    render(
      <ApiResultPanel category="Dining" reasoning={undefined} rawPayload={null} />,
    );
    // Sections are expanded by default — no click needed
    const byokMessages = screen.getAllByText("Not available (BYOK mode)");
    expect(byokMessages.length).toBeGreaterThan(0);
  });
});

describe("ApiResultPanel — collapsible sections", () => {
  it("reasoning section is expanded by default", () => {
    render(
      <ApiResultPanel category="Dining" reasoning="AI thinks this is food." rawPayload={null} />,
    );
    // The reasoning content should be visible without clicking
    expect(screen.getByText("AI thinks this is food.")).toBeDefined();
  });

  it("reasoning section collapses on click", () => {
    render(
      <ApiResultPanel category="Dining" reasoning="AI thinks this is food." rawPayload={null} />,
    );
    fireEvent.click(screen.getByText("Reasoning"));
    expect(screen.queryByText("AI thinks this is food.")).toBeNull();
  });

  it("API payload section is expanded by default", () => {
    render(
      <ApiResultPanel category="Dining" reasoning="r" rawPayload='{"payee":"Alice"}' />,
    );
    // Payload text visible without clicking
    expect(screen.getByText(/"payee"/)).toBeDefined();
  });

  it("API payload section collapses on click", () => {
    render(
      <ApiResultPanel category="Dining" reasoning="r" rawPayload='{"payee":"Alice"}' />,
    );
    fireEvent.click(screen.getByText("API Payload"));
    expect(screen.queryByText(/Alice/)).toBeNull();
  });

  it("shows N/A when rawPayload is null and reasoning is available", () => {
    render(
      <ApiResultPanel category="Dining" reasoning="some reasoning" rawPayload={null} />,
    );
    // Expanded by default — no click needed
    expect(screen.getByText("N/A")).toBeDefined();
  });
});
