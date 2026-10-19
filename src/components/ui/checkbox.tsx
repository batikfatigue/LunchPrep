"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Square checkbox built on Radix, supporting the indeterminate state used by
 * the review table's "select all" header cell.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-[18px] shrink-0 rounded-[5px] border-2 border-ink bg-card transition-shadow outline-none",
        "focus-visible:shadow-hard-sm",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-cta data-[state=checked]:text-cta-foreground",
        "data-[state=indeterminate]:bg-cta data-[state=indeterminate]:text-cta-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" aria-hidden />
        ) : (
          <Check className="size-3" aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
