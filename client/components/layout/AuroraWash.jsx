import Image from "next/image";

import { cn } from "@/lib/utils";

const HEADER_BG = "/top-header-gradient-bg.jpeg";

/**
 * Soft grainy header image used on Home and Profile.
 * Sit this behind page titles; content stays in a relative layer.
 */
export function AuroraWash({ className }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden", className)}
    >
      <Image
        src={HEADER_BG}
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover object-[center_72%]"
      />
    </div>
  );
}
