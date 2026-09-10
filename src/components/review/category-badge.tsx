"use client";

/**
 * Category badge rendered inside the review table's category dropdown trigger.
 *
 * Colour and icon come from `getCategoryStyle`, so a given category always
 * looks the same across rows and pages.
 */

import * as React from "react";
import {
  ArrowLeftRight,
  Bus,
  Clapperboard,
  GraduationCap,
  HeartPulse,
  Plug,
  Repeat,
  ShoppingBag,
  ShoppingBasket,
  Tag,
  TriangleAlert,
  User,
  Utensils,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getCategoryStyle,
  type CategoryIconName,
} from "@/lib/review/category-style";

/** Icon component for each `CategoryIconName`. */
const ICONS: Record<CategoryIconName, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  "shopping-basket": ShoppingBasket,
  bus: Bus,
  "shopping-bag": ShoppingBag,
  clapperboard: Clapperboard,
  plug: Plug,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  user: User,
  "arrow-left-right": ArrowLeftRight,
  wallet: Wallet,
  repeat: Repeat,
  tag: Tag,
};

export interface CategoryBadgeProps {
  /** Category label. Empty string renders the placeholder badge. */
  category: string;
  /**
   * Render the amber "Needs Review" treatment instead of the category colour.
   * Used when the assigned category is low-confidence.
   */
  needsReview?: boolean;
  className?: string;
}

/**
 * Pill showing a category with its icon, or a "Needs Review" / "Uncategorised"
 * placeholder.
 *
 * @param props - See CategoryBadgeProps.
 */
export function CategoryBadge({ category, needsReview, className }: CategoryBadgeProps) {
  if (needsReview) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
          "border-amber-200 bg-amber-50 text-amber-700",
          "dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
          className,
        )}
      >
        <TriangleAlert className="size-3 shrink-0" aria-hidden />
        Needs Review
      </span>
    );
  }

  const style = getCategoryStyle(category);
  const Icon = ICONS[style.icon];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        style.className,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {category || "Uncategorised"}
    </span>
  );
}
