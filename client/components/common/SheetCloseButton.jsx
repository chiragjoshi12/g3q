"use client";

import { Cross } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Global popup close control — same cross on every sheet. */
export function SheetCloseButton({ onClick, className }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("close")}
      className={cn(
        "absolute right-3 top-3 z-10 grid size-9 shrink-0 place-items-center rounded-full bg-[#f5f5f5] text-[#6B7280] transition-transform active:scale-95",
        className
      )}
    >
      <Cross className="size-5" />
    </button>
  );
}
