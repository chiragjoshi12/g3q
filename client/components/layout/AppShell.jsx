import { cn } from "@/lib/utils";

/**
 * Full-viewport application frame.
 *
 * Mobile stays edge-to-edge. From `md` up the same column sits on a grey
 * canvas as a rounded device so the product never stretches to ultrawide.
 */
export function AppShell({ children, className }) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background md:items-center md:justify-center md:bg-[#D4D8DE] md:p-5 lg:p-8">
      <div
        className={cn(
          "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
          "md:h-[min(54rem,calc(100dvh-2.5rem))] md:w-full md:max-w-[32rem] md:rounded-[1.85rem] md:shadow-[0_28px_80px_rgb(15_23_42/0.22),0_0_0_1px_rgb(255_255_255/0.55)] md:ring-1 md:ring-black/[0.08] lg:h-[min(54rem,calc(100dvh-4rem))]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
