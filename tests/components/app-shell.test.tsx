import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/app-shell";
import type { AiProviderSettings } from "@/components/api-key-input";

afterEach(cleanup);

const ai = {
  provider: "gemini",
  geminiKey: "",
  openaiKey: "",
  openaiBaseUrl: "",
  openaiModel: "",
} as unknown as AiProviderSettings;

function shell(step: "upload" | "review" | "export" = "upload") {
  return render(
    <AppShell
      currentStep={step}
      aiSettings={ai}
      onAiSettingsChange={vi.fn()}
      categories={["Dining", "Groceries"]}
      onCategoriesChange={vi.fn()}
    >
      <h1>Page body</h1>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders one progress landmark, a skip link and the page body", () => {
    shell("review");
    expect(screen.getAllByRole("navigation", { name: "Import progress" })).toHaveLength(1);
    expect(screen.getByText("Skip to content").getAttribute("href")).toBe(
      "#main-content",
    );
    expect(screen.getByText("Page body")).toBeTruthy();
  });

  it("opens the settings dialog from the mobile menu", () => {
    shell();
    const toggle = screen.getByRole("button", { name: "Toggle workspace menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const mobile = document.getElementById("mobile-menu") as HTMLElement;
    fireEvent.click(mobile.querySelectorAll("button")[0]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    // Opening a panel collapses the menu.
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the settings dialog with the Done button", () => {
    shell();
    fireEvent.click(screen.getAllByRole("button", { name: /Settings/ })[0]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
