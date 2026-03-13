/**
 * Unit tests for navigation-helpers.ts.
 *
 * Covers: forward/backward search, wrap-around, no matches (null), all reviewed,
 * single match, and current index is a match (must skip to next).
 */

import { describe, it, expect } from "vitest";
import {
    findNextUnreviewed,
    findPrevUnreviewed,
    findNextFlagged,
    findPrevFlagged,
} from "../navigation-helpers";
import type { ReviewStatus } from "../review-controls";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StatusValue = ReviewStatus["status"];

/** Build a reviewMap from an object mapping index → status string. */
function makeReviewMap(
    entries: Record<number, StatusValue>,
): Map<number, ReviewStatus> {
    return new Map(
        Object.entries(entries).map(([k, status]) => [
            Number(k),
            { status, note: "" },
        ]),
    );
}

const EMPTY = new Map<number, ReviewStatus>();

// ---------------------------------------------------------------------------
// findNextUnreviewed
// ---------------------------------------------------------------------------

describe("findNextUnreviewed", () => {
    it("finds the next unreviewed transaction after currentIndex", () => {
        // 0 is ok, 1 is flagged → next unreviewed after 0 should be 2
        const map = makeReviewMap({ 0: "ok", 1: "flagged" });
        expect(findNextUnreviewed(0, 5, map)).toBe(2);
    });

    it("wraps around when next unreviewed is before currentIndex", () => {
        // 1..9 all reviewed; 0 is unreviewed → wraps from 9 to 0
        const entries: Record<number, StatusValue> = {};
        for (let i = 1; i <= 9; i++) entries[i] = "ok";
        const map = makeReviewMap(entries);
        expect(findNextUnreviewed(9, 10, map)).toBe(0);
    });

    it("returns null when all transactions are reviewed (ok or flagged)", () => {
        const entries: Record<number, StatusValue> = {};
        for (let i = 0; i < 5; i++) entries[i] = i % 2 === 0 ? "ok" : "flagged";
        const map = makeReviewMap(entries);
        expect(findNextUnreviewed(0, 5, map)).toBeNull();
    });

    it("returns null when transactionCount is 1 (no other transaction)", () => {
        expect(findNextUnreviewed(0, 1, EMPTY)).toBeNull();
    });

    it("skips the current index even if it is unreviewed", () => {
        // 0 is unreviewed, 1 is unreviewed → starting at 0, result must be 1 (not 0)
        expect(findNextUnreviewed(0, 3, makeReviewMap({ 2: "ok" }))).toBe(1);
    });

    it("finds single unreviewed transaction in a mostly-reviewed set", () => {
        // Only index 3 is unreviewed
        const entries: Record<number, StatusValue> = {};
        for (let i = 0; i < 5; i++) if (i !== 3) entries[i] = "ok";
        const map = makeReviewMap(entries);
        expect(findNextUnreviewed(1, 5, map)).toBe(3);
    });

    it("neutral status counts as unreviewed for navigation", () => {
        const map = makeReviewMap({ 0: "ok", 1: "neutral", 2: "ok" });
        expect(findNextUnreviewed(0, 3, map)).toBe(1);
    });

    it("all transactions unreviewed, returns currentIndex+1", () => {
        expect(findNextUnreviewed(2, 5, EMPTY)).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// findPrevUnreviewed
// ---------------------------------------------------------------------------

describe("findPrevUnreviewed", () => {
    it("finds the previous unreviewed transaction before currentIndex", () => {
        const map = makeReviewMap({ 3: "ok", 4: "flagged" });
        expect(findPrevUnreviewed(4, 5, map)).toBe(2);
    });

    it("wraps around when previous unreviewed is after currentIndex", () => {
        // 0..7 all reviewed; 8 and 9 are unreviewed → from index 0, wraps to 9
        const entries: Record<number, StatusValue> = {};
        for (let i = 0; i <= 7; i++) entries[i] = "ok";
        const map = makeReviewMap(entries);
        expect(findPrevUnreviewed(0, 10, map)).toBe(9);
    });

    it("returns null when all transactions are reviewed", () => {
        const entries: Record<number, StatusValue> = {};
        for (let i = 0; i < 4; i++) entries[i] = "ok";
        const map = makeReviewMap(entries);
        expect(findPrevUnreviewed(2, 4, map)).toBeNull();
    });

    it("returns null when transactionCount is 1", () => {
        expect(findPrevUnreviewed(0, 1, EMPTY)).toBeNull();
    });

    it("skips the current index even if it is unreviewed", () => {
        // Starting at 2, which is unreviewed, should return 1 (not 2)
        expect(findPrevUnreviewed(2, 4, makeReviewMap({ 3: "ok" }))).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// findNextFlagged
// ---------------------------------------------------------------------------

describe("findNextFlagged", () => {
    it("finds the next flagged transaction after currentIndex", () => {
        const map = makeReviewMap({ 0: "ok", 3: "flagged" });
        expect(findNextFlagged(1, 5, map)).toBe(3);
    });

    it("wraps around when next flagged is before currentIndex", () => {
        const map = makeReviewMap({ 2: "flagged", 8: "flagged" });
        // From index 8, should wrap to 2
        expect(findNextFlagged(8, 10, map)).toBe(2);
    });

    it("returns null when no flagged transactions exist", () => {
        const map = makeReviewMap({ 0: "ok", 1: "ok", 2: "neutral" });
        expect(findNextFlagged(0, 3, map)).toBeNull();
    });

    it("returns null when transactionCount is 1", () => {
        const map = makeReviewMap({ 0: "flagged" });
        expect(findNextFlagged(0, 1, map)).toBeNull();
    });

    it("skips the current index even if it is flagged", () => {
        // Index 0 is flagged, index 2 is flagged; starting at 0 should return 2
        const map = makeReviewMap({ 0: "flagged", 2: "flagged" });
        expect(findNextFlagged(0, 3, map)).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// findPrevFlagged
// ---------------------------------------------------------------------------

describe("findPrevFlagged", () => {
    it("finds the previous flagged transaction before currentIndex", () => {
        const map = makeReviewMap({ 2: "flagged", 5: "ok" });
        expect(findPrevFlagged(4, 6, map)).toBe(2);
    });

    it("wraps around when previous flagged is after currentIndex", () => {
        const map = makeReviewMap({ 8: "flagged" });
        // From index 2, wraps around to find 8
        expect(findPrevFlagged(2, 10, map)).toBe(8);
    });

    it("returns null when no flagged transactions exist", () => {
        const map = makeReviewMap({ 0: "ok", 1: "neutral", 2: "ok" });
        expect(findPrevFlagged(2, 3, map)).toBeNull();
    });

    it("returns null when transactionCount is 1", () => {
        expect(findPrevFlagged(0, 1, EMPTY)).toBeNull();
    });

    it("skips the current index even if it is flagged", () => {
        const map = makeReviewMap({ 0: "flagged", 3: "flagged" });
        // Starting at 3 (flagged), should wrap and find 0
        expect(findPrevFlagged(3, 4, map)).toBe(0);
    });
});
