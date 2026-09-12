"use client";

import { useEffect, useState } from "react";

import { BrandIcon } from "@/components/common/BrandIcon";
import { LANGUAGE_OPTIONS } from "@/config/languages";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language.store";

/** Same language picker as Profile: round icon button + dropdown. */
export function LanguageMenu({ align = "right", buttonClassName, iconClassName, onOpenChange }) {
  const { t, language } = useI18n();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  const setMenuOpen = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!event.target.closest("[data-language-menu]")) setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div data-language-menu className="relative z-50">
      <button
        type="button"
        onClick={() => setMenuOpen(!open)}
        aria-label={t("language")}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "grid size-10 place-items-center rounded-full border border-[#E8ECF0] bg-white text-[#111] transition-transform active:scale-95",
          buttonClassName
        )}
      >
        <BrandIcon src={BRAND_ICONS.language} alt="" className={cn("size-5", iconClassName)} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t("selectLanguage")}
          className={cn(
            "absolute top-[calc(100%+0.55rem)] z-50 w-[11.5rem] rounded-[1.35rem] bg-white p-3 shadow-[0_14px_36px_rgb(15_23_42/0.18)]",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const active = language === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLanguage(option.id);
                  setMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-colors",
                  active ? "bg-[#E8E8E8]" : "hover:bg-[#F3F3F3]"
                )}
              >
                <BrandIcon src={BRAND_ICONS.language} alt="" className="size-6 shrink-0" />
                <span
                  className={cn(
                    "font-heading text-[16px] text-[#111]",
                    active ? "font-bold" : "font-medium"
                  )}
                >
                  {option.englishLabel}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
