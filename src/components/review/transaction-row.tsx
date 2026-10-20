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
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDashed,
} from "lucide-react";

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
  placeholder = "-",
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
          "w-full rounded-md border border-foreground bg-card px-1.5 py-0.5 text-sm outline-none",
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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startEdit();
        }
      }}
      title="Click to edit"
      className={cn(
        "block cursor-text rounded-md px-1.5 py-0.5 transition-colors hover:bg-card",
        !value && "text-ink-mute",
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
      role="row"
      className={cn(
        "border-b transition-colors duration-150 last:border-0 hover:bg-card/70",
        "max-md:grid max-md:grid-cols-[auto_1fr_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-1 max-md:px-0 max-md:py-4",
        isSelected && "bg-muted ring-1 ring-inset ring-foreground",
        onRowSelect && "cursor-pointer",
      )}
      onClick={() => {
        if (editJustEndedRef.current) return;
        onRowSelect?.(index);
      }}
    >
      {/* Selection */}
      <td role="cell" className="w-10 px-4 py-4 max-md:col-start-1 max-md:row-start-1 max-md:w-auto max-md:px-0 max-md:py-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(index, value === true)}
          aria-label={`Select transaction ${index + 1}`}
        />
      </td>

      {/* Date */}
      <td role="cell" className="tabular whitespace-nowrap px-3 py-4 text-sm text-muted-foreground max-md:col-span-2 max-md:col-start-2 max-md:row-start-1 max-md:px-0 max-md:py-0 max-md:text-xs">
        {formatTableDate(transaction.date)}
      </td>

      {/* Payee + notes */}
      <td role="cell" className="min-w-48 px-3 py-4 max-md:col-span-3 max-md:row-start-2 max-md:min-w-0 max-md:px-0 max-md:py-0">
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
            className="text-sm text-muted-foreground"
          />
        )}
      </td>

      {/* Category */}
      <td role="cell" className="px-3 py-4 max-md:col-span-2 max-md:row-start-3 max-md:px-0 max-md:py-0">
        <Select.Root
          value={selectedCategory}
          onValueChange={(value) => onCategoryChange(index, value)}
        >
          <Select.Trigger
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex max-w-full items-center gap-2 rounded-full py-0.5 pl-0 pr-2",
              "transition-colors hover:bg-card",
            )}
            aria-label="Select category"
          >
            <CategoryBadge
              category={selectedCategory}
              needsReview={needsReview && !!selectedCategory}
            />
            <ChevronDown
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 max-h-60 min-w-[10rem] overflow-auto rounded-md border bg-popover py-1 shadow-sm"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport>
                {categories.map((cat) => (
                  <Select.Item
                    key={cat}
                    value={cat}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm outline-none",
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
        role="cell"
        className={cn(
          "tabular whitespace-nowrap px-3 py-4 text-right text-sm max-md:col-start-3 max-md:row-start-3 max-md:px-0 max-md:py-0",
          isDebit ? "text-muted-foreground" : "font-medium text-foreground",
        )}
      >
        {formatAmount(transaction.amount)}
      </td>

      {/* AI confidence */}
      <td role="cell" className="px-3 py-4 max-md:hidden">
        <ReviewStatusIcon status={reviewStatus} />
      </td>
    </tr>
  );
}

/**
 * Glyph plus a short word summarising a row's review status. Filled check =
 * categorised, triangle = needs review, dashed circle = not categorised.
 *
 * @param {ReviewStatus} props.status - Derived review status.
 * @returns {JSX.Element} Status indicator.
 */
function ReviewStatusIcon({ status }: { status: ReviewStatus }) {
  const meta =
    status === "categorised"
      ? { Icon: CheckCircle2, text: "Done", label: "Categorised", tone: "text-foreground" }
      : status === "needs-review"
        ? { Icon: CircleAlert, text: "Check", label: "Needs your review", tone: "text-foreground font-medium" }
        : { Icon: CircleDashed, text: "Open", label: "Not categorised", tone: "text-ink-mute" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", meta.tone)}>
      <meta.Icon className="size-4" aria-label={meta.label} />
      <span className="hidden xl:inline" aria-hidden>
        {meta.text}
      </span>
    </span>
  );
}
