/**
 * Transaction category definitions for Lunch Money export.
 *
 * Provides the default category list and a utility to load user-customised
 * categories from localStorage (Phase 3 feature).
 */

/**
 * Default set of categories used for AI categorisation and the review table.
 * Order determines display order in the category dropdown.
 */
export const DEFAULT_CATEGORIES: string[] = [
  "Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Education",
  "Personal",
  "Transfers",
  "Income",
  "Other",
];

/** localStorage key for persisted custom categories (Phase 3). */
const CATEGORIES_STORAGE_KEY = "lunchprep_categories";

/**
 * Load the active category list.
 *
 * Reads from localStorage if available and valid; falls back to
 * DEFAULT_CATEGORIES. Guards against SSR and non-browser environments.
 *
 * @returns Array of category strings.
 */
export function loadCategories(): string[] {
  // Reason: localStorage is unavailable in SSR (Next.js server rendering)
  // and in Vitest unless specifically mocked.
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;

  try {
    const stored = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!stored) return DEFAULT_CATEGORIES;

    const parsed = JSON.parse(stored) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed as string[];
    }
  } catch {
    // Ignore malformed JSON or storage access errors
  }

  return DEFAULT_CATEGORIES;
}

/**
 * Persist a custom category list to localStorage.
 *
 * No-ops in non-browser environments.
 *
 * @param categories - Array of category strings to persist.
 */
export function saveCategories(categories: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    // Ignore storage quota errors
  }
}
