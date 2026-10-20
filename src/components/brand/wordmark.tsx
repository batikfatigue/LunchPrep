import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * LunchPrep wordmark: the supplied lunchbox artwork (`src/app/icon.png`,
 * served at `/icon.png`) beside the lowercase product name set in mono.
 * The artwork is shown unaltered on the page ground in light and dark
 * (no tile or background behind it). Lunch Money's own marks are never used.
 *
 * @param {{ className?: string; size?: number }} props - Optional text sizing classes and icon edge in px.
 * @returns {JSX.Element} Brand lockup.
 */
export function Wordmark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 py-1", className)}>
      <Image
        src="/icon.png"
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
      <span className="font-mono text-[1.0625rem] font-semibold leading-none tracking-[-0.03em]">
        lunchprep
      </span>
    </span>
  );
}
