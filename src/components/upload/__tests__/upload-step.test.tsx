// @vitest-environment happy-dom
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadStep, type UploadStepProps } from "@/components/upload/upload-step";

function setup(overrides: Partial<UploadStepProps> = {}) {
  const props: UploadStepProps = {
    onFileSelect: vi.fn(),
    onFileClear: vi.fn(),
    selectedFile: null,
    isLoading: false,
    error: null,
    onContinue: vi.fn(),
    onTrySample: vi.fn(),
    aiSettings: {
      provider: "gemini",
      geminiKey: "",
      openaiKey: "",
    } as UploadStepProps["aiSettings"],
    onAiSettingsChange: vi.fn(),
    mode: "manual",
    onModeChange: vi.fn(),
    ...overrides,
  };
  render(<UploadStep {...props} />);
  return props;
}

describe("UploadStep import intro", () => {
  it("keeps the anchor ids and labelled section", () => {
    setup();
    const section = document.getElementById("import");
    expect(section?.getAttribute("aria-labelledby")).toBe("upload-title");
    expect(document.getElementById("import-label")).not.toBeNull();
    expect(document.getElementById("upload-title")?.tabIndex).toBe(-1);
    cleanup();
  });

  it("lists export steps natively and states CSV-only guidance", () => {
    setup();
    const list = screen.getByRole("list", { name: /export from DBS/i });
    expect(list.tagName).toBe("OL");
    expect(list.querySelectorAll("li")).toHaveLength(3);
    expect(list.textContent).toMatch(/PDF statements aren.t supported/);
    cleanup();
  });

  it("fires the sample action when idle", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: /try a sample/i }));
    expect(props.onTrySample).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("disables the sample action while loading", () => {
    const props = setup({ isLoading: true });
    const button = screen.getByRole("button", { name: /try a sample/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(props.onTrySample).not.toHaveBeenCalled();
    cleanup();
  });
});

describe("import steps stylesheet contract", () => {
  it("colours .import-steps with a defined theme token", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const block = css.match(/\.import-steps\s*\{[^}]*\}/)?.[0] ?? "";
    expect(block).toContain("color: var(--muted-foreground)");
    expect(css).not.toMatch(/var\(--ink-soft\)/);
  });
});
