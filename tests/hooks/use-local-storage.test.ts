import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/use-local-storage";

// happy-dom provides a full localStorage implementation in the test environment.

beforeEach(() => {
  localStorage.clear();
});

describe("useLocalStorage", () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it("returns the initial value when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default"),
    );
    expect(result.current[0]).toBe("default");
  });

  it("reads an existing value from localStorage on mount", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"));
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default"),
    );
    expect(result.current[0]).toBe("stored-value");
  });

  it("writes the updated value to localStorage when set is called", async () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial"),
    );

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("test-key") ?? "null")).toBe("updated");
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("works with array initial values", () => {
    const initial = ["a", "b", "c"];
    const { result } = renderHook(() =>
      useLocalStorage("arr-key", initial),
    );
    expect(result.current[0]).toEqual(initial);
  });

  it("reads an existing array from localStorage", () => {
    localStorage.setItem("arr-key", JSON.stringify(["x", "y"]));
    const { result } = renderHook(() =>
      useLocalStorage("arr-key", ["default"]),
    );
    expect(result.current[0]).toEqual(["x", "y"]);
  });

  it("falls back to initial value when localStorage contains malformed JSON", () => {
    localStorage.setItem("bad-key", "not-valid-json{{{");
    const { result } = renderHook(() =>
      useLocalStorage("bad-key", 42),
    );
    // Reason: Malformed JSON should not crash the app — fall back gracefully.
    expect(result.current[0]).toBe(42);
  });

  it("multiple updates persist each new value", () => {
    const { result } = renderHook(() =>
      useLocalStorage("counter-key", 0),
    );

    act(() => result.current[1](1));
    act(() => result.current[1](2));
    act(() => result.current[1](3));

    expect(result.current[0]).toBe(3);
    expect(JSON.parse(localStorage.getItem("counter-key") ?? "0")).toBe(3);
  });
});
