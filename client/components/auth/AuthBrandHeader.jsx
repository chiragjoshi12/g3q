"use client";

import { ACTION_BUTTON_CLASS } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { useI18n } from "@/lib/i18n";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/** Login Next / Submit — pale fill while the field is still empty. */
export const AUTH_BUTTON_CLASS = cn(
  ACTION_BUTTON_CLASS,
  "disabled:bg-[#e5ebf8] disabled:text-[#f5f5f5]"
);

export const AUTH_FIELD_CLASS =
  "h-16 w-full rounded-[1.3rem] border-0 bg-white px-5 text-base tracking-wide text-foreground outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-[#737373] translate-y-3 lg:h-[4.35rem] lg:rounded-[1.4rem] lg:px-6 lg:text-[1.05rem]";

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
  const { appName } = useI18n();

  return (
    <header className="relative z-20 shrink-0 bg-white px-4 py-2.5 lg:px-8 lg:py-5">
      <BrandIcon
        src={BRAND_ICONS.logo}
        alt="G3Q 3.0"
        priority
        className="size-11 shrink-0 lg:size-14"
      />

      <h1 className="absolute inset-0 flex items-center justify-center font-heading text-[1.35rem] leading-none font-bold tracking-tight text-[#2C6698] lg:text-[1.75rem]">
        {appName}
      </h1>
    </header>
  );
}