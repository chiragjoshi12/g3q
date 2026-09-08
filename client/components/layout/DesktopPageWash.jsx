/** Soft top wash used on desktop landing / home. Mobile never renders this. */
export const DESKTOP_PAGE_WASH =
  "linear-gradient(180deg, #dfddf1 0%, rgba(248,235,239,0.845) 15.5%, rgba(243,242,255,0.215) 78.5%, rgba(243,242,255,0) 100%)";

export function DesktopPageWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(32rem,48%)]"
      style={{ background: DESKTOP_PAGE_WASH }}
    />
  );
}
