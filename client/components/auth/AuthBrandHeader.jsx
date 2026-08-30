import { BrandIcon } from "@/components/common/BrandIcon";
import { appConfig } from "@/config/app.config";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/** Next sits a little inside the field width — same height, not a skinny pill. */
export const AUTH_BUTTON_CLASS =
  "mx-auto h-14 w-[86%] bg-[#2d689d] text-base hover:bg-[#255a88]";

export const AUTH_FIELD_CLASS =
  "h-14 w-full rounded-full border-0 bg-white px-5 text-base tracking-wide text-foreground shadow-[0_0_0_1px_#E5E7EB] outline-none transition-shadow placeholder:font-sans placeholder:tracking-normal placeholder:text-[#9CA3AF] focus:shadow-[0_0_0_2px_#2d689d]";

export function AuthLink({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "text-sm font-medium text-primary-600 underline underline-offset-2 transition-colors hover:text-primary-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * White bar used on every login step: compact G3Q mark + navy title.
 */
export function AuthBrandHeader() {
  return (
    <header className="relative z-20 shrink-0 bg-white px-4 py-2.5 shadow-[0_1px_0_rgb(15_23_42/0.08)]">
      <div className="flex items-center gap-3">
        <BrandIcon
          src={BRAND_ICONS.logo}
          alt="G3Q 2.0"
          priority
          className="size-11 shrink-0"
        />
        <h1 className="font-heading text-[1.35rem] leading-none font-bold tracking-tight text-[#2C6698]">
          {appConfig.name}
        </h1>
      </div>
    </header>
  );
}
