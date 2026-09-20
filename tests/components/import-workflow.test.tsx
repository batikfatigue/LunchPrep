import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Home from "@/app/page";
import { callCategorise } from "@/lib/categoriser/client";
import { downloadCsv } from "@/lib/exporter/lunchmoney";
import { createSampleStatement } from "@/lib/sample-statement";
import { SESSION_KEY, serialiseSession } from "@/lib/session";

vi.mock("@/lib/categoriser/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/categoriser/client")>()),
  callCategorise: vi.fn(),
}));
vi.mock("@/lib/exporter/lunchmoney", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/exporter/lunchmoney")>()),
  downloadCsv: vi.fn(),
}));

const csv = [
  "Account,Sample",
  "Currency,SGD",
  "Period,August",
  "",
  "",
  "",
  "Transaction Date,Transaction Code,Description,Transaction Ref1,Transaction Ref2,Transaction Ref3,Status,Debit Amount,Credit Amount",
  "02 Aug 2026,POS,Sample Cafe,,,,,10.50,",
].join("\n");

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

function selectFile(content = csv, filename = "statement.csv") {
  fireEvent.drop(screen.getByRole("button", { name: /Drop CSV file/ }), {
    dataTransfer: {
      files: [new File([content], filename, { type: "text/csv" })],
    },
  });
}

function selectMode(name: RegExp) {
  fireEvent.click(screen.getByText("Categorisation"));
  fireEvent.click(screen.getByRole("radio", { name }));
}

describe("guided import workflow", () => {
  it("parses a manual import, saves the review, and exports without contacting AI", async () => {
    render(<Home />);
    selectMode(/I'll categorise myself/);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    await screen.findByRole("heading", { name: "The details, made clear." });
    expect(callCategorise).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1 })).toBe(
      document.activeElement,
    );

    await waitFor(
      () => expect(localStorage.getItem(SESSION_KEY)).not.toBeNull(),
      { timeout: 2500 },
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue to export" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Download Lunch Money CSV" }),
    );
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.stringContaining("2026-08-02,"),
    );
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("explores and downloads sample data without overwriting or clearing a saved review", async () => {
    const sample = createSampleStatement();
    const saved = serialiseSession({ filename: "saved-review.csv", ...sample });
    localStorage.setItem(SESSION_KEY, saved);
    render(<Home />);
    fireEvent.click(
      screen.getByRole("button", { name: /Try a sample statement/ }),
    );
    await screen.findByRole("heading", { name: "The details, made clear." });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });
    expect(localStorage.getItem(SESSION_KEY)).toBe(saved);
    expect(callCategorise).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Re-categorise" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue to export" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Download sample CSV" }),
    );
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.stringContaining("FairPrice Finest"),
    );
    expect(localStorage.getItem(SESSION_KEY)).toBe(saved);
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    fireEvent.click(screen.getByRole("button", { name: "Start new import" }));
    fireEvent.click(screen.getByRole("button", { name: "Resume review" }));
    expect(screen.getByText("saved-review.csv")).toBeTruthy();
  });

  it("applies a category only to selected rows and keeps edits when returning from export", async () => {
    render(<Home />);
    fireEvent.click(
      screen.getByRole("button", { name: /Try a sample statement/ }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select transaction 1" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Select transaction 8" }),
    );
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Category for selected transactions",
      }),
      { target: { value: "Dining" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply to selected" }));
    expect(
      screen.queryByRole("button", { name: "Apply to selected" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue to export" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to review" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to export" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Download sample CSV" }),
    );
    const exported = vi.mocked(downloadCsv).mock.calls[0][0];
    expect(exported).toContain("FairPrice Finest,-64.80,Dining");
    expect(exported).toContain("Unlabelled purchase,-24.00,Dining");
    expect(exported).toContain("SimplyGo,-2.18,Transport");
  });

  it("preserves the current review when a reset is cancelled", () => {
    render(<Home />);
    fireEvent.click(
      screen.getByRole("button", { name: /Try a sample statement/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep reviewing" }));
    expect(
      screen.getByRole("heading", { name: "The details, made clear." }),
    ).toBeTruthy();
    expect(screen.getByText("FairPrice Finest")).toBeTruthy();
  });

  it("blocks invalid file replacements and supports clearing a selection", () => {
    render(<Home />);
    selectFile();
    expect(
      screen
        .getByRole("button", { name: "Continue to review" })
        .hasAttribute("disabled"),
    ).toBe(false);
    selectFile("not a csv", "statement.pdf");
    expect(screen.getByRole("alert").textContent).toMatch(/csv/i);
    expect(
      screen
        .getByRole("button", { name: "Continue to review" })
        .hasAttribute("disabled"),
    ).toBe(true);
    selectFile();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove selected file" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Continue to review" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("keeps malformed CSVs on upload without calling AI", async () => {
    render(<Home />);
    selectFile("invalid,headers\nwrong,data");
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(
      /Unsupported bank CSV/,
    );
    expect(callCategorise).not.toHaveBeenCalled();
  });

  it("routes shared AI explicitly without a stored key and leaves failures manually reviewable", async () => {
    vi.mocked(callCategorise).mockRejectedValueOnce(
      new Error("Provider unavailable"),
    );
    render(<Home />);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Provider unavailable",
    );
    expect(callCategorise).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      null,
    );
    expect(
      screen
        .getByRole("button", { name: "Continue to export" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("requires a saved BYOK key before preparing a statement", () => {
    render(<Home />);
    selectMode(/Use my own API key/);
    selectFile();
    expect(
      screen
        .getByRole("button", { name: "Continue to review" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByText(/Add and save your API key/)).toBeTruthy();
  });

  it("uses a saved BYOK configuration for the selected provider", async () => {
    localStorage.setItem("lunchprep_ai_provider", JSON.stringify("gemini"));
    localStorage.setItem("lunchprep_gemini_key", JSON.stringify("test-key"));
    vi.mocked(callCategorise).mockResolvedValueOnce({
      results: [{ index: 0, category: "Dining" }],
    });
    render(<Home />);
    selectFile();
    fireEvent.click(screen.getByRole("button", { name: "Continue to review" }));
    await waitFor(() =>
      expect(callCategorise).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        { provider: "gemini", apiKey: "test-key" },
      ),
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Continue to export" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects multiple dropped statements rather than silently choosing one", () => {
    render(<Home />);
    fireEvent.drop(screen.getByRole("button", { name: /Drop CSV file/ }), {
      dataTransfer: {
        files: [new File([csv], "one.csv"), new File([csv], "two.csv")],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain("one");
    expect(
      screen
        .getByRole("button", { name: "Continue to review" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
});
