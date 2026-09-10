"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Fixed hit target + soft fill used everywhere a back chevron appears. */
export const BACK_BUTTON_CLASS =
  "grid size-10 shrink-0 place-items-center rounded-full bg-[#f5f5f5] transition-transform active:scale-95 disabled:opacity-50";

export const BACK_ICON_CLASS = "size-3.5";

/**
 * Global back control — same size, icon scale, and background on every screen.
 */
export function BackButton({ onClick, label, className, ...props }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || t("back")}
      className={cn(BACK_BUTTON_CLASS, className)}
      {...props}
    >
      <BrandIcon src={BRAND_ICONS.back} alt="" className={BACK_ICON_CLASS} />
    </button>
  );
}
