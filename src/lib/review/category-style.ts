/**
 * Neutral pill styling and icons for category badges in the review table.
 *
 * Categories are user-editable, so styling is resolved by keyword first and
 * falls back to a deterministic palette slot derived from the category name.
 * The same category therefore always renders with the same icon.
 */

/** Tailwind classes plus the lucide icon name used for a category badge. */
export interface CategoryStyle {
  /** Background + text + border classes for both light and dark themes. */
  className: string;
  /** Key into the icon map in `category-badge.tsx`. */
  icon: CategoryIconName;
}

/** Icon keys supported by the category badge. */
export type CategoryIconName =
  | "utensils"
  | "shopping-basket"
  | "bus"
  | "shopping-bag"
  | "clapperboard"
  | "plug"
  | "heart-pulse"
  | "graduation-cap"
  | "user"
  | "arrow-left-right"
  | "wallet"
  | "repeat"
  | "tag";

/**
 * Quiet Editorial: category pills are neutral. The icon and the label carry
 * the meaning, so every slot shares one hairline treatment (see DESIGN.md).
 * No rainbow tags.
 */
const NEUTRAL = "bg-card text-foreground border-border";
const PALETTE: Record<string, string> = {
  green: NEUTRAL,
  amber: NEUTRAL,
  rose: NEUTRAL,
  violet: NEUTRAL,
  sky: NEUTRAL,
  teal: NEUTRAL,
  slate: "border-dashed border-input bg-transparent text-ink-mute",
};

/** Palette slots used when no keyword matches, in hash order. */
const FALLBACK_SLOTS: string[] = ["violet", "sky", "teal", "amber", "rose", "green"];

/** Keyword → style rules, evaluated in order against the lowercased category. */
const KEYWORD_RULES: Array<{
  keywords: string[];
  colour: keyof typeof PALETTE;
  icon: CategoryIconName;
}> = [
  { keywords: ["dining", "restaurant", "food", "eat"], colour: "amber", icon: "utensils" },
  { keywords: ["grocer", "supermarket"], colour: "green", icon: "shopping-basket" },
  { keywords: ["transport", "travel", "commute"], colour: "violet", icon: "bus" },
  { keywords: ["shopping", "retail"], colour: "rose", icon: "shopping-bag" },
  { keywords: ["entertain", "leisure"], colour: "violet", icon: "clapperboard" },
  { keywords: ["subscription", "recurring"], colour: "sky", icon: "repeat" },
  { keywords: ["utilit", "bill"], colour: "teal", icon: "plug" },
  { keywords: ["health", "medical"], colour: "rose", icon: "heart-pulse" },
  { keywords: ["education", "school", "course"], colour: "sky", icon: "graduation-cap" },
  { keywords: ["personal"], colour: "teal", icon: "user" },
  { keywords: ["transfer"], colour: "sky", icon: "arrow-left-right" },
  { keywords: ["income", "salary"], colour: "green", icon: "wallet" },
];

/**
 * Deterministic non-negative hash of a string, used to pick a palette slot.
 *
 * @param value - String to hash.
 * @returns Non-negative integer hash.
 */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Resolve the badge styling for a category name.
 *
 * @param category - Category label (may be empty for unassigned rows).
 * @returns Tailwind classes and the icon to render.
 */
export function getCategoryStyle(category: string): CategoryStyle {
  const key = category.trim().toLowerCase();
  if (!key) return { className: PALETTE.slate, icon: "tag" };

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => key.includes(kw))) {
      return { className: PALETTE[rule.colour], icon: rule.icon };
    }
  }

  const slot = FALLBACK_SLOTS[hash(key) % FALLBACK_SLOTS.length];
  return { className: PALETTE[slot], icon: "tag" };
}
