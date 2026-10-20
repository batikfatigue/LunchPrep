import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScrollLink } from "@/components/scroll-link";

/** Fake page: scrollY is writable, one section sits 2000px down, header bottom at 100px. */
let scrollY = 0;
let now = 0;
let frames: FrameRequestCallback[] = [];
let reduced = false;
const positions: number[] = [];

function runFrame(ms = 16) {
  now += ms;
  const queued = frames;
  frames = [];
  act(() => queued.forEach((cb) => cb(now)));
}
function runFor(ms: number) {
  for (let t = 0; t < ms; t += 16) runFrame();
}

beforeEach(() => {
  scrollY = 0;
  now = 0;
  frames = [];
  reduced = false;
  positions.length = 0;
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(5000);
  vi.spyOn(window, "scrollTo").mockImplementation(((opts: ScrollToOptions) => {
    expect(opts.behavior).toBe("instant"); // Reason: CSS smooth must not stack on our easing.
    scrollY = opts.top ?? 0;
    positions.push(scrollY);
  }) as typeof window.scrollTo);
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) => ({ matches: reduced && q.includes("reduce") }) as MediaQueryList,
  );
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames = [];
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup() {
  const view = render(
    <>
      <header />
      <ScrollLink href="#import" focusId="title">Go</ScrollLink>
      <section id="import">
        <h2 id="title" tabIndex={-1}>Start</h2>
      </section>
    </>,
  );
  vi.spyOn(document.querySelector("header")!, "getBoundingClientRect").mockImplementation(
    () => ({ bottom: 100, height: 100 }) as DOMRect,
  );
  vi.spyOn(document.getElementById("import")!, "getBoundingClientRect").mockImplementation(
    () => ({ top: 2100 - scrollY }) as DOMRect, // document top 2100 -> destination 2000
  );
  return view;
}

describe("ScrollLink", () => {
  it("keeps a real hash href so it works without JavaScript", () => {
    render(<ScrollLink href="#import">Import a statement</ScrollLink>);
    expect(screen.getByRole("link").getAttribute("href")).toBe("#import");
  });

  it("takes over the click, animates over many frames, then focuses without a jump", () => {
    setup();
    const notPrevented = fireEvent.click(screen.getByRole("link"));
    expect(notPrevented).toBe(false); // Reason: no native jump before the animation.
    expect(scrollY).toBe(0);
    expect(document.activeElement?.id).not.toBe("title");

    runFor(400);
    expect(scrollY).toBeGreaterThan(0);
    expect(scrollY).toBeLessThan(2000);
    expect(document.activeElement?.id).not.toBe("title"); // no focus until arrival

    runFor(1400);
    expect(scrollY).toBe(2000);
    expect(document.activeElement?.id).toBe("title");
    // Perceptible: many distinct, monotonic intermediate positions, no single leap.
    expect(positions.length).toBeGreaterThan(30);
    expect(positions.every((p, i) => i === 0 || p >= positions[i - 1])).toBe(true);
    expect(Math.max(...positions.slice(1).map((p, i) => p - positions[i]))).toBeLessThan(100);
    expect(window.location.hash).toBe("#import");
  });

  it("restarts cleanly from the current position on a repeat click", () => {
    setup();
    fireEvent.click(screen.getByRole("link"));
    runFor(300);
    const mid = scrollY;
    fireEvent.click(screen.getByRole("link"));
    runFrame();
    expect(Math.abs(scrollY - mid)).toBeLessThan(50); // continues, doesn't snap
    runFor(1500);
    expect(scrollY).toBe(2000);
  });

  it("stops where it is when the user scrolls", () => {
    setup();
    fireEvent.click(screen.getByRole("link"));
    runFor(300);
    const stoppedAt = scrollY;
    fireEvent.wheel(window);
    runFor(1500);
    expect(scrollY).toBe(stoppedAt);
    expect(document.activeElement?.id).not.toBe("title");
  });

  it("yields to scrollbar drags that fire no input event", () => {
    setup();
    fireEvent.click(screen.getByRole("link"));
    runFor(200);
    scrollY = 3500; // external move
    runFor(1500);
    expect(scrollY).toBe(3500);
  });

  it("lands the target's top edge on the header's bottom edge, and mirrors header height", () => {
    setup();
    document.documentElement.style.removeProperty("--header-h");
    fireEvent.click(screen.getByRole("link"));
    runFor(1500);
    const header = document.querySelector("header")!.getBoundingClientRect().bottom;
    const top = document.getElementById("import")!.getBoundingClientRect().top;
    expect(Math.abs(top - header)).toBeLessThanOrEqual(0.5);
  });

  it("sets --header-h from the measured header on mount", () => {
    render(<header />);
    vi.spyOn(document.querySelector("header")!, "getBoundingClientRect").mockReturnValue({ bottom: 87, height: 87 } as DOMRect);
    render(<ScrollLink href="#import">Go</ScrollLink>);
    expect(document.documentElement.style.getPropertyValue("--header-h")).toBe("87px");
  });

  it("is instant and native under prefers-reduced-motion", () => {
    reduced = true;
    setup();
    const notPrevented = fireEvent.click(screen.getByRole("link"));
    expect(notPrevented).toBe(true);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(frames.length).toBe(0);
  });

  it("leaves modified clicks to the browser and tolerates a missing target", () => {
    setup();
    expect(fireEvent.click(screen.getByRole("link"), { ctrlKey: true })).toBe(true);
    cleanup();
    render(<ScrollLink href="#nowhere">Go</ScrollLink>);
    expect(() => fireEvent.click(screen.getByRole("link"))).not.toThrow();
  });

  it("activates from the keyboard like a click", () => {
    setup();
    const link = screen.getByRole("link");
    link.focus();
    fireEvent.keyDown(link, { key: "Enter" });
    fireEvent.click(link, { detail: 0 }); // Reason: browsers synthesise click on Enter.
    runFor(1500);
    expect(scrollY).toBe(2000);
  });
});

describe("scroll CSS contract", () => {
  const css = readFileSync("src/app/globals.css", "utf8");

  it("offsets anchors by exactly the sticky header, no extra gap", () => {
    expect(css).toMatch(/scroll-padding-top: var\(--header-h\);/);
    expect(css).not.toMatch(/scroll-margin/);
  });

  it("still forces auto scroll under reduced motion", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*scroll-behavior: auto !important/);
  });
});
