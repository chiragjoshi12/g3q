import { ContentWidth } from "@/components/layout/ContentWidth";
import { cn } from "@/lib/utils";

/** Scrollable content region of a screen, with the app's entry transition. */
export function Screen({
  children,
  className,
  contentClassName,
  padded = true,
  animate = true,
  size = "default",
}) {
  return (
    <main
      className={cn(
        "no-scrollbar flex-1 overflow-x-hidden overflow-y-auto overscroll-contain",
        animate && "animate-screen-in",
        className
      )}
    >
      <ContentWidth
        size={size}
        className={cn(padded && "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6", contentClassName)}
      >
        {children}
      </ContentWidth>
    </main>
  );
}
