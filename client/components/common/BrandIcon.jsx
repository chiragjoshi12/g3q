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
