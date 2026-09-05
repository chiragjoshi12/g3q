import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Soft grainy header image used on Home and Profile.
 * Sit this behind page titles; content stays in a relative layer.
 */
export function AuroraWash({
  className,
  src,
  imageClassName,
  unoptimized = false,
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden", className)}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        priority
        unoptimized={unoptimized}
        className={cn("object-cover object-[center_72%]", imageClassName)}
      />
    </div>
  );
}
