"use client";

import { cn } from "@/lib/utils";
import { AuthToasts } from "@/components/common/AuthToasts";

/**
 * Full-viewport application frame.
 *
 * Mobile stays edge-to-edge. From `md` up the same column sits on a grey
 * canvas as a rounded device so the product never stretches to ultrawide.
 *
 * `fullOnDesktop` drops that device chrome from `lg` up so a page can use
 * a real wide layout. Below `lg` nothing changes.
 */
export function AppShell({ children, className, fullOnDesktop = false }) {
  return (
    <div
      className={cn(
        "flex h-dvh w-full flex-col overflow-hidden bg-background md:items-center md:justify-center md:bg-[#D4D8DE] md:p-5 lg:p-8",
        fullOnDesktop && "lg:items-stretch lg:justify-start lg:bg-transparent lg:p-0"
      )}
    >
      <div
        data-app-frame
        className={cn(
          "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
          "md:h-[min(54rem,calc(100dvh-2.5rem))] md:w-full md:max-w-[32rem] md:rounded-[1.85rem] md:shadow-[0_28px_80px_rgb(15_23_42/0.22),0_0_0_1px_rgb(255_255_255/0.55)] md:ring-1 md:ring-black/[0.08] lg:h-[min(54rem,calc(100dvh-4rem))]",
          fullOnDesktop && "lg:h-full lg:max-w-none lg:rounded-none lg:shadow-none lg:ring-0",
          className
        )}
      >
        {children}
        <AuthToasts />
      </div>
    </div>
  );
}
