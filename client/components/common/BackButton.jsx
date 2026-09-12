"use client";

import { BackArrow } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Shared round hit target. Fill is set by `surface` on `BackButton`. */
export const BACK_BUTTON_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full p-0 leading-none text-[#6B7280] transition-transform active:scale-95 disabled:opacity-50";

export const BACK_ICON_CLASS = "block size-5 lg:size-6";

/**
 * Global back control.
 * `surface` is the colour behind the button: white → gray fill, muted → white fill.
 */
export function BackButton({ onClick, label, className, surface = "white", ...props }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || t("back")}
      className={cn(
        BACK_BUTTON_CLASS,
        surface === "muted" ? "bg-white" : "bg-[#f5f5f5]",
        className
      )}
      {...props}
    >
      <BackArrow className={BACK_ICON_CLASS} />
    </button>
  );
}
