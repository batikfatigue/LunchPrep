"use client";

/**
 * A single row of the review table.
 *
 * Renders the selection checkbox, date, inline-editable payee, category
 * dropdown (styled as a coloured badge), amount, and the AI confidence icon.
 * Notes are edited inline underneath the payee so the row stays compact.
 */

import * as React from "react";
import { Select } from "radix-ui";
import { CheckCircle2, ChevronDown, CircleAlert, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryBadge } from "@/components/review/category-badge";
import {
  formatAmount,
  formatTableDate,
  type ReviewStatus,
} from "@/lib/review/status";
import type { RawTransaction } from "@/lib/parsers/types";

// ---------------------------------------------------------------------------
// EditableCell
// ---------------------------------------------------------------------------

interface EditableCellProps {
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
  /** Called when the input blurs (edit ends), before any follow-up row click fires. */
  onEditEnd?: () => void;
  className?: string;
}

/**
 * A cell that switches to a text input on click.
 * Commits on blur or Enter; cancels on Escape.
 *
 * @param props - See EditableCellProps.
 */
export function EditableCell({
  value,
  placeholder = "—",
  onCommit,
  onEditEnd,
  className,
}: EditableCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync draft when the upstream value changes (e.g. after restore()).
  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    onCommit(draft);
  }

  function cancel() {
    setEditing(false);
    setDraft(value);
  }

  // Auto-focus the input when editing starts.
  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        // Reason: stop propagation so clicks inside the active input do not bubble to <tr onClick>.
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          commit();
          // Reason: notify the row that an edit just ended so it can suppress the
          // follow-up click that caused this blur (blur fires before click).
          onEditEnd?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn(
          "w-full rounded border bg-background px-1.5 py-0.5 text-sm outline-none",
          "focus:ring-2 focus:ring-ring focus:ring-offset-0",
          className,
        )}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // Reason: stop propagation so clicking to enter edit mode does not bubble to <tr onClick>.
        e.stopPropagation();
        startEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") startEdit();
      }}
      title="Click to edit"
      className={cn(
        "block cursor-text rounded px-1.5 py-0.5 hover:bg-accent/50",
        !value && "text-muted-foreground/50",
        className,
      )}
    >
      {value || placeholder}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

export interface TransactionRowProps {
  /** Absolute index of the transaction in the unfiltered list. */
  index: number;
  transaction: RawTransaction;
  /** Available category options. */
  categories: string[];
  /** Currently assigned category ("" when unassigned). */
  selectedCategory: string;
  /** Derived review status driving the badge and AI column. */
  reviewStatus: ReviewStatus;
  /** Whether the row's checkbox is ticked. */
  checked: boolean;
  onCheckedChange: (index: number, checked: boolean) => void;
  onCategoryChange: (index: number, category: string) => void;
  onPayeeChange?: (index: number, payee: string) => void;
  onNotesChange?: (index: number, notes: string) => void;
  onRowSelect?: (index: number) => void;
  /** Whether the row is highlighted (dev-tools inspector selection). */
  isSelected?: boolean;
}

/**
 * Render one transaction as a table row.
 *
 * @param props - See TransactionRowProps.
 */
export function TransactionRow({
  index,
  transaction,
  categories,
  selectedCategory,
  reviewStatus,
  checked,
  onCheckedChange,
  onCategoryChange,
  onPayeeChange,
  onNotesChange,
  onRowSelect,
  isSelected,
}: TransactionRowProps) {
  const isDebit = transaction.amount < 0;
  const needsReview = reviewStatus === "needs-review";

  // Reason: When the user clicks elsewhere on the row to blur an active EditableCell,
  // the browser fires blur before click. This one-frame refractory flag lets us detect
  // that "blur-caused click" and skip onRowSelect, preventing an unwanted inspector scroll.
  const editJustEndedRef = React.useRef(false);

  function handleEditEnd() {
    editJustEndedRef.current = true;
    setTimeout(() => {
      editJustEndedRef.current = false;
    }, 0);
  }

  return (
    <tr
      className={cn(
        "border-b last:border-0 transition-colors hover:bg-muted/40",
        needsReview && "bg-amber-50/60 dark:bg-amber-950/20",
        isSelected && "bg-accent/40 ring-1 ring-inset ring-ring/20",
        onRowSelect && "cursor-pointer",
      )}
      onClick={() => {
        if (editJustEndedRef.current) return;
        onRowSelect?.(index);
      }}
    >
      {/* Selection */}
      <td className="w-10 px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(index, value === true)}
          aria-label={`Select transaction ${index + 1}`}
        />
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
        {formatTableDate(transaction.date)}
      </td>

      {/* Payee + notes */}
      <td className="px-3 py-2 font-medium">
        {onPayeeChange ? (
          <EditableCell
            value={transaction.description}
            onCommit={(val) => onPayeeChange(index, val)}
            onEditEnd={handleEditEnd}
          />
        ) : (
          transaction.description
        )}
        {onNotesChange && (
          <EditableCell
            value={transaction.notes}
            placeholder="Add note…"
            onCommit={(val) => onNotesChange(index, val)}
            onEditEnd={handleEditEnd}
            className="text-xs font-normal text-muted-foreground"
          />
        )}
      </td>

      {/* Category */}
      <td className="px-3 py-2">
        <Select.Root
          value={selectedCategory}
          onValueChange={(value) => onCategoryChange(index, value)}
        >
          <Select.Trigger
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex w-full max-w-44 items-center justify-between gap-1 rounded-full border bg-background/60 py-0.5 pl-0.5 pr-2",
              "transition-colors hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            )}
            aria-label="Select category"
          >
            <CategoryBadge
              category={selectedCategory}
              needsReview={needsReview && !!selectedCategory}
              className="border-transparent bg-transparent dark:bg-transparent"
            />
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" aria-hidden />
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 max-h-60 min-w-[9rem] overflow-auto rounded-md border bg-popover shadow-md"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport>
                {categories.map((cat) => (
                  <Select.Item
                    key={cat}
                    value={cat}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-xs outline-none",
                      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    )}
                  >
                    <Select.ItemText>{cat}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </td>

      {/* Amount */}
      <td
        className={cn(
          "whitespace-nowrap px-3 py-2 text-right tabular-nums",
          isDebit ? "text-foreground" : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {formatAmount(transaction.amount)}
      </td>

      {/* AI confidence */}
      <td className="px-3 py-2">
        <ReviewStatusIcon status={reviewStatus} />
      </td>
    </tr>
  );
}

/**
 * Icon summarising a row's review status in the AI column.
 *
 * @param props.status - Derived review status.
 */
function ReviewStatusIcon({ status }: { status: ReviewStatus }) {
  if (status === "categorised") {
    return (
      <CheckCircle2
        className="size-4 text-emerald-600 dark:text-emerald-400"
        aria-label="Categorised with high confidence"
      />
    );
  }
  if (status === "needs-review") {
    return (
      <CircleAlert
        className="size-4 text-amber-500"
        aria-label="Needs your review"
      />
    );
  }
  return (
    <CircleDashed
      className="size-4 text-muted-foreground/60"
      aria-label="Not categorised"
    />
  );
}
