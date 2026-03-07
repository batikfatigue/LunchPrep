"use client";

/**
 * Category management UI component.
 *
 * Allows the user to add, remove, and reorder the list of categories
 * used for AI categorisation. Reordering is done via drag-and-drop
 * (mouse and keyboard). Changes are propagated via `onCategoriesChange`
 * and persisted to localStorage by the parent (via the useLocalStorage hook).
 */

import * as React from "react";
import { Plus, X, GripVertical, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_CATEGORIES } from "@/lib/categoriser/categories";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Compute the reordered category list after a drag-and-drop operation.
 *
 * Returns `null` if the drag is a no-op (same position or unknown ids).
 *
 * @param categories - The current ordered list of categories.
 * @param activeId - The id (category string) of the item being dragged.
 * @param overId - The id (category string) of the item it was dropped on.
 * @returns The reordered list, or `null` if no change should be made.
 */
export function reorderCategories(
  categories: string[],
  activeId: string,
  overId: string
): string[] | null {
  if (activeId === overId) return null;
  const oldIndex = categories.indexOf(activeId);
  const newIndex = categories.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return null;
  return arrayMove(categories, oldIndex, newIndex);
}

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
// EditableCategory
// ---------------------------------------------------------------------------

interface EditableCategoryProps {
  value: string;
  existingCategories: string[];
  onSave: (newValue: string) => void;
}

function EditableCategory({ value, existingCategories, onSave }: EditableCategoryProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === value) {
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    // Checking for duplicates, ignoring the current category itself
    const isDuplicate = existingCategories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== value.toLowerCase()
    );

    if (isDuplicate) {
      setEditValue(value); // Revert on duplicate
      setIsEditing(false);
      return;
    }

    onSave(trimmed);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-6 flex-1 text-sm px-1 py-0 mr-1"
        aria-label={`Edit category ${value}`}
      />
    );
  }

  return (
    <span
      className="flex-1 truncate text-sm cursor-text hover:bg-muted/50 rounded px-1 -ml-1 transition-colors"
      onClick={() => {
        setEditValue(value);
        setIsEditing(true);
      }}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SortableCategoryRow
// ---------------------------------------------------------------------------

interface SortableCategoryRowProps {
  id: string;
  index: number;
  value: string;
  existingCategories: string[];
  /** True when ANY item in the list is mid-drag. */
  isDraggingActive: boolean;
  onSave: (newValue: string) => void;
  onRemove: () => void;
  /** Register a focusable element ref for grid keyboard navigation. */
  registerRef: (row: number, col: number, el: HTMLButtonElement | null) => void;
  /** Handle arrow key navigation within the category grid. */
  onGridKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
}

/**
 * A draggable category row using @dnd-kit/sortable.
 *
 * Renders a drag handle (GripVertical) that supports both pointer drag and
 * keyboard navigation (Space/Enter to pick up, Arrow keys to move, Escape to cancel).
 * When not dragging, arrow keys provide grid-style navigation between elements.
 *
 * @param props - See SortableCategoryRowProps.
 */
function SortableCategoryRow({
  id,
  index,
  value,
  existingCategories,
  isDraggingActive,
  onSave,
  onRemove,
  registerRef,
  onGridKeyDown,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Reason: raise z-index while dragging so the ghost floats above other rows
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 rounded-md border bg-background px-2 py-1"
    >
      {/* Drag handle — column 0 */}
      <button
        ref={(el) => registerRef(index, 0, el)}
        type="button"
        className={cn(
          "text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none",
          // During an active drag: hide the browser focus ring on all handles,
          // then show an explicit ring on the item being moved.
          isDraggingActive && !isDragging && "focus:outline-none focus-visible:outline-none focus-visible:ring-0",
          isDraggingActive && isDragging && "ring-2 ring-ring rounded-sm",
        )}
        aria-label={`Drag to reorder "${value}"`}
        {...attributes}
        {...listeners}
        onKeyDown={(e) => {
          // ArrowUp/Down/Left/Right: grid navigation (when not mid-drag).
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            onGridKeyDown(e, index, 0);
            return;
          }
          // Forward all other keys to @dnd-kit's keyboard listener.
          if (listeners?.onKeyDown) {
            (listeners.onKeyDown as (e: React.KeyboardEvent) => void)(e);
          }
        }}
      >
        <GripVertical className="size-3.5" />
      </button>

      <EditableCategory
        value={value}
        existingCategories={existingCategories}
        onSave={onSave}
      />

      {/* Remove — column 1 */}
      <button
        ref={(el) => registerRef(index, 1, el)}
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
        aria-label={`Remove "${value}"`}
        onKeyDown={(e) => {
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
            onGridKeyDown(e, index, 1);
          }
        }}
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// CategoryEditor
// ---------------------------------------------------------------------------

/**
 * Category list editor with add, remove, drag-to-reorder, inline edit, and reset-to-defaults.
 *
 * @param props - See CategoryEditorProps.
 */
export function CategoryEditor({ categories, onCategoriesChange }: CategoryEditorProps) {
  const [newCategory, setNewCategory] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);
  const [isDraggingActive, setIsDraggingActive] = React.useState(false);
  // Reason: useId() generates a stable ID that matches between server and client,
  // preventing hydration mismatches from @dnd-kit's internal counter.
  const dndContextId = React.useId();

  // ---------------------------------------------------------------------------
  // Grid navigation refs — 2D map: gridRefs[row][col] = HTMLButtonElement
  // ---------------------------------------------------------------------------

  const gridRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  function registerRef(row: number, col: number, el: HTMLButtonElement | null) {
    const key = `${row}-${col}`;
    if (el) {
      gridRefs.current.set(key, el);
    } else {
      gridRefs.current.delete(key);
    }
  }

  /**
   * Grid-style arrow key handler.
   * ArrowUp/Down: same column, adjacent row (wraps).
   * ArrowLeft/Right: adjacent column, same row (clamps).
   */
  function handleGridKeyDown(e: React.KeyboardEvent, row: number, col: number) {
    const maxRow = categories.length - 1;
    const maxCol = 1; // 0 = drag handle, 1 = remove button
    let nextRow = row;
    let nextCol = col;

    switch (e.key) {
      case "ArrowDown":
        nextRow = row < maxRow ? row + 1 : 0;
        break;
      case "ArrowUp":
        nextRow = row > 0 ? row - 1 : maxRow;
        break;
      case "ArrowRight":
        nextCol = Math.min(col + 1, maxCol);
        break;
      case "ArrowLeft":
        nextCol = Math.max(col - 1, 0);
        break;
    }

    const target = gridRefs.current.get(`${nextRow}-${nextCol}`);
    target?.focus();
  }

  // ---------------------------------------------------------------------------
  // DnD sensors
  // ---------------------------------------------------------------------------

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ---------------------------------------------------------------------------
  // DnD handler
  // ---------------------------------------------------------------------------

  /**
   * Handle the end of a drag event. Reorders the category list if the item
   * was moved to a different position.
   *
   * @param event - The DragEndEvent from @dnd-kit/core.
   */
  function handleDragEnd(event: DragEndEvent) {
    setIsDraggingActive(false);
    const { active, over } = event;
    if (!over) return;
    const reordered = reorderCategories(categories, active.id as string, over.id as string);
    if (reordered) onCategoriesChange(reordered);
  }

  // ---------------------------------------------------------------------------
  // Edit / remove helpers
  // ---------------------------------------------------------------------------

  /**
   * Remove a category by value.
   *
   * @param value - The category string to remove.
   */
  function removeCategory(value: string) {
    onCategoriesChange(categories.filter((c) => c !== value));
  }

  /**
   * Edit a category at a given index.
   *
   * @param index - The index of the item to edit.
   * @param newValue - The new category name.
   */
  function handleEditCategory(index: number, newValue: string) {
    const updated = [...categories];
    updated[index] = newValue;
    onCategoriesChange(updated);
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

      {/* Category list with DnD */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDraggingActive(true)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setIsDraggingActive(false)}
      >
        <SortableContext items={categories} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1" role="grid" aria-label="Category list">
            {categories.map((cat, index) => (
              <SortableCategoryRow
                key={cat}
                id={cat}
                index={index}
                value={cat}
                existingCategories={categories}
                isDraggingActive={isDraggingActive}
                onSave={(newValue) => handleEditCategory(index, newValue)}
                onRemove={() => removeCategory(cat)}
                registerRef={registerRef}
                onGridKeyDown={handleGridKeyDown}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

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
