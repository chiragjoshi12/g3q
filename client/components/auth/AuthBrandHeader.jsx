import { BrandIcon } from "@/components/common/BrandIcon";
import { appConfig } from "@/config/app.config";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/** Same pill as Play Quiz / Next / Submit. */
export { ACTION_BUTTON_CLASS as AUTH_BUTTON_CLASS } from "@/components/common/AppButton";

export const AUTH_FIELD_CLASS =
  "h-16 w-full rounded-[1.3rem] border-0 bg-white px-5 text-base tracking-wide text-foreground outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-[#737373]";

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
    <header className="relative z-20 shrink-0 bg-white px-4 py-2.5">
      <BrandIcon
        src={BRAND_ICONS.logo}
        alt="G3Q 2.0"
        priority
        className="size-11 shrink-0"
      />

      <h1 className="absolute inset-0 flex items-center justify-center font-heading text-[1.35rem] leading-none font-bold tracking-tight text-[#2C6698]">
        {appConfig.name}
      </h1>
    </header>
  );
}