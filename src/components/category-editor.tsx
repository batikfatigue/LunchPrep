"use client";

/**
 * Category management UI component.
 *
 * Allows the user to add, remove, and reorder the list of categories
 * used for AI categorisation. Changes are propagated via `onCategoriesChange`
 * and persisted to localStorage by the parent (via the useLocalStorage hook).
 */

import * as React from "react";
import { Plus, X, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryEditorProps {
  /**
   * The current list of categories managed by the parent.
   */
  categories: string[];
  /**
   * Callback fired on every change (add, remove, reorder, reset).
   * The parent is responsible for persisting to localStorage.
   *
   * @param categories - Updated category list.
   */
  onCategoriesChange: (categories: string[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Category list editor with add, remove, reorder, and reset-to-defaults.
 *
 * @param props - See CategoryEditorProps.
 */
export function CategoryEditor({ categories, onCategoriesChange }: CategoryEditorProps) {
  const [newCategory, setNewCategory] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Reorder helpers
  // ---------------------------------------------------------------------------

  /**
   * Move a category one position up in the list.
   *
   * @param index - The index of the item to move up.
   */
  function moveUp(index: number) {
    if (index <= 0) return;
    const updated = [...categories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onCategoriesChange(updated);
  }

  /**
   * Move a category one position down in the list.
   *
   * @param index - The index of the item to move down.
   */
  function moveDown(index: number) {
    if (index >= categories.length - 1) return;
    const updated = [...categories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onCategoriesChange(updated);
  }

  /**
   * Remove a category at a given index.
   *
   * @param index - The index of the item to remove.
   */
  function removeCategory(index: number) {
    onCategoriesChange(categories.filter((_, i) => i !== index));
  }

  // ---------------------------------------------------------------------------
  // Add handler
  // ---------------------------------------------------------------------------

  function handleAdd() {
    const trimmed = newCategory.trim();

    if (!trimmed) {
      setAddError("Category name cannot be empty.");
      return;
    }

    // Reason: Case-insensitive duplicate check ensures "dining" and "Dining"
    // are treated as the same category, preventing confusing duplicates.
    const isDuplicate = categories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      setAddError(`"${trimmed}" already exists.`);
      return;
    }

    setAddError(null);
    setNewCategory("");
    onCategoriesChange([...categories, trimmed]);
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  function handleReset() {
    onCategoriesChange([...DEFAULT_CATEGORIES]);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Categories</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleReset}
          title="Reset to defaults"
          aria-label="Reset categories to defaults"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </div>

      {/* Category list */}
      <ul className="flex flex-col gap-1">
        {categories.map((cat, index) => (
          <li
            key={`${cat}-${index}`}
            className="flex items-center gap-1 rounded-md border bg-background px-2 py-1"
          >
            <span className="flex-1 truncate text-sm">{cat}</span>

            {/* Move up */}
            <button
              type="button"
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label={`Move "${cat}" up`}
            >
              <ChevronUp className="size-3.5" />
            </button>

            {/* Move down */}
            <button
              type="button"
              onClick={() => moveDown(index)}
              disabled={index === categories.length - 1}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label={`Move "${cat}" down`}
            >
              <ChevronDown className="size-3.5" />
            </button>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeCategory(index)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove "${cat}"`}
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Add new category */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Input
            placeholder="New category…"
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
              setAddError(null);
            }}
            onKeyDown={handleAddKeyDown}
            aria-label="New category name"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAdd}
            aria-label="Add category"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        {addError && (
          <p role="alert" className="text-xs text-destructive">
            {addError}
          </p>
        )}
      </div>
    </div>
  );
}
