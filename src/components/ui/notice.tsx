import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const noticeVariants = cva(
  "flex items-start gap-3 rounded-md border-2 p-3 text-xs leading-5",
  {
    variants: {
      tone: {
        // Reason: warnings reuse the brand yellow instead of a second amber hue.
        warning: "border-ink bg-cta/30 text-foreground",
        info: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

/**
 * Inline status message with a leading icon. Uses `role="status"` so screen
 * readers announce it politely without stealing focus.
 */
function Notice({
  className,
  tone = "info",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof noticeVariants>) {
  const Icon = tone === "warning" ? CircleAlert : Info;
  return (
    <div
      role="status"
      data-slot="notice"
      data-tone={tone}
      className={cn(noticeVariants({ tone }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export { Notice, noticeVariants };
