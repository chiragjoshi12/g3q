import { AppShell } from "@/components/layout/AppShell";
import { DesktopPageWash } from "@/components/layout/DesktopPageWash";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { cn } from "@/lib/utils";

/** Centered content column used on desktop app pages. */
export const DESKTOP_MAIN =
  "lg:mx-auto lg:w-full lg:max-w-[56rem] lg:px-10 xl:max-w-[64rem] xl:px-14";

/**
 * Phone-frame AppShell below `lg`. From `lg` up: optional sidebar, grey canvas,
 * and optional top wash. Pass `footer` for mobile-only overlays (BottomNav).
 */
export function DesktopAppShell({
  children,
  className,
  showSidebar = true,
  showWash = false,
  footer = null,
}) {
  return (
    <AppShell fullOnDesktop className={cn(className, "lg:bg-transparent")}>
      <div className="flex h-full min-h-0 w-full flex-1">
        {showSidebar ? <DesktopSidebar /> : null}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:bg-[#f5f5f5]">
          {showWash ? (
            <div className="hidden lg:block">
              <DesktopPageWash />
            </div>
          ) : null}
          <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
      {footer}
    </AppShell>
  );
}
