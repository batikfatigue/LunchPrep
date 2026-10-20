"use client";

import * as React from "react";

export interface ScrollLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** In-page target, e.g. "#import". Must be a hash on this page. */
  href: `#${string}`;
  /** Id of the heading that receives focus on arrival; defaults to the target. */
  focusId?: string;
}

/** Shortest and longest travel time in ms; distance in between is scaled. */
const MIN_DURATION = 600;
const MAX_DURATION = 1100;
/** Scroll speed used to scale duration, in px per ms (about 1px per 1.4ms). */
const PX_PER_MS = 0.7;

/** Ease-in-out cubic: gentle start, clear middle, soft landing. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Input that means "the user took over"; cancels an animation in flight. */
const CANCEL_EVENTS = ["wheel", "touchstart", "mousedown", "keydown"] as const;

/** The sticky page header, the only thing the target must clear. */
const headerElement = () => document.querySelector<HTMLElement>("body header");

/**
 * Scroll position at which the top edge of `element` (its border) sits exactly
 * on the bottom edge of the sticky header, clamped to the scrollable range.
 *
 * Reason: both edges are measured from the live DOM, so responsive header
 * height, a wrapped second row, an open menu or font scaling cannot skew it,
 * and no CSS padding/margin offset is added on top.
 *
 * @param {HTMLElement} element - Scroll target.
 * @returns {number} Target `scrollY` in px.
 */
function destinationFor(element: HTMLElement): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const headerBottom = headerElement()?.getBoundingClientRect().bottom ?? 0;
  const top = element.getBoundingClientRect().top + window.scrollY - headerBottom;
  return Math.max(0, Math.min(top, max));
}

/**
 * Mirrors the real header height into `--header-h`, so the CSS
 * `scroll-padding-top` used by native jumps (reduced motion, no JS fallback
 * after hydration, URL hashes) equals the header exactly instead of a guess.
 */
function useHeaderOffset() {
  React.useEffect(() => {
    const header = headerElement();
    if (!header) return;
    const sync = () =>
      document.documentElement.style.setProperty("--header-h", `${header.getBoundingClientRect().height}px`);
    sync();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    observer?.observe(header);
    window.addEventListener("resize", sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", sync);
      document.documentElement.style.removeProperty("--header-h");
    };
  }, []);
}

/**
 * In-page anchor that works without JavaScript (plain `href="#id"`, native jump
 * and `:target` styling) and, with JS, scrolls to the target with a controlled,
 * clearly visible animation, then moves focus to the destination heading.
 *
 * Reason: native `scroll-behavior: smooth` was unreliable in real browsers
 * (fragment navigation, focus and OS settings each can turn it into a jump), so
 * the click is intercepted and the scroll is driven frame by frame. Each frame
 * uses `behavior: "instant"` so the CSS `scroll-behavior: smooth` in globals.css
 * cannot add a second easing on top. Reduced motion, modified clicks and a
 * missing target fall back to the browser's own (instant) anchor navigation.
 *
 * @param {ScrollLinkProps} props - Anchor props plus the optional focus target.
 * @returns {JSX.Element} An anchor element.
 */
export function ScrollLink({ href, focusId, onClick, ...rest }: ScrollLinkProps) {
  const stopRef = React.useRef<(() => void) | null>(null);
  useHeaderOffset();

  // Reason: leaving the page mid-animation must not leave listeners or frames behind.
  React.useEffect(() => () => stopRef.current?.(), []);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const section = document.getElementById(href.slice(1));
    const focusTarget = document.getElementById(focusId ?? href.slice(1));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const modified = event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

    if (modified) return; // Reason: let "open in new tab" and friends behave normally.

    if (!section || reduced) {
      // Native, instant jump; focus on the next task after fragment navigation.
      window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), 0);
      return;
    }

    event.preventDefault();
    stopRef.current?.(); // Repeat click: restart from wherever the page is now.

    const start = window.scrollY;
    const distance = Math.abs(destinationFor(section) - start);
    if (distance < 0.5) {
      focusTarget?.focus({ preventScroll: true });
      return;
    }
    const duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, distance / PX_PER_MS));
    const startTime = performance.now();
    let frame = 0;
    let expected = start;

    const stop = () => {
      cancelAnimationFrame(frame);
      CANCEL_EVENTS.forEach((name) => window.removeEventListener(name, cancel));
      stopRef.current = null;
    };
    // Reason: any wheel, touch, press or key means the user is steering; stop where we are.
    function cancel(e?: Event) {
      // Reason: Enter/Shift/Tab are how the link itself was activated, not steering.
      if (e instanceof KeyboardEvent && ["Enter", "Shift", "Tab"].includes(e.key)) return;
      stop();
      window.history.pushState(null, "", href);
    }
    const finish = () => {
      stop();
      window.scrollTo({ top: destinationFor(section), behavior: "instant" });
      // Reason: setting the hash now records history and updates :target; the page
      // is already in place so the browser's own fragment scroll is a no-op.
      window.location.hash = href;
      // Reason: the browser's own fragment scroll should be a no-op (scroll-padding
      // equals the header), but if rounding moved it, put it back at once.
      if (Math.abs(destinationFor(section) - window.scrollY) > 0.5) {
        window.scrollTo({ top: destinationFor(section), behavior: "instant" });
      }
      focusTarget?.focus({ preventScroll: true });
    };
    const step = (now: number) => {
      // Reason: a scrollbar drag or find-in-page moves the page without any input
      // event above; if we are not where we last put the page, yield to the user.
      if (Math.abs(window.scrollY - expected) > 2) return cancel();
      const t = Math.min(1, (now - startTime) / duration);
      if (t >= 1) return finish();
      // Reason: re-read the destination each frame so late layout shifts don't miss.
      expected = start + (destinationFor(section) - start) * ease(t);
      window.scrollTo({ top: expected, behavior: "instant" });
      expected = window.scrollY;
      frame = requestAnimationFrame(step);
    };

    stopRef.current = stop;
    CANCEL_EVENTS.forEach((name) => window.addEventListener(name, cancel, { passive: true }));
    frame = requestAnimationFrame(step);
  };

  return <a href={href} onClick={handleClick} {...rest} />;
}
