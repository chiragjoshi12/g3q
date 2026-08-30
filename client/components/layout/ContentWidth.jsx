import { cn } from "@/lib/utils";

const SIZES = {
  phone: "max-w-[26.5rem]",
  feed: "max-w-[26.5rem] md:max-w-3xl lg:max-w-4xl",
  play: "max-w-[26.5rem] md:max-w-[72rem] lg:max-w-[80rem] xl:max-w-[90rem]",
  narrow: "max-w-xl md:max-w-2xl lg:max-w-3xl",
  default: "max-w-3xl lg:max-w-5xl xl:max-w-6xl",
  wide: "max-w-5xl xl:max-w-7xl",
};

/**
 * Centers page content and lets it grow with the viewport.
 *
 * Chrome (headers, nav, footers) stays full-bleed; this wraps the inner
 * column so type and controls never stretch to ultrawide widths.
 */
export function ContentWidth({ children, className, size = "default" }) {
  return (
    <div className={cn("mx-auto w-full", SIZES[size] ?? SIZES.default, className)}>
      {children}
    </div>
  );
}
