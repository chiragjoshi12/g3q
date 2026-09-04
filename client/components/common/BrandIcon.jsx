import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * PNG from `public/icons/`. Display size comes from `className` (`size-5`, etc.).
 */
export function BrandIcon({ src, alt = "", className, priority = false }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={80}
      height={80}
      priority={priority}
      className={cn("pointer-events-none object-contain", className)}
    />
  );
}

/** SVG (or other) artwork tinted with `color` via CSS mask. */
export function BrandGlyph({ src, className, color }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 bg-current", className)}
      style={{
        color,
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
