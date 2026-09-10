"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { DESKTOP_OVERLAY, DESKTOP_OVERLAY_CARD } from "@/components/layout/desktop-overlay";
import { LANGUAGE_OPTIONS } from "@/config/languages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language.store";

/**
 * Profile language picker bottom sheet — shows Gu / En / Hi with the
 * current selection highlighted.
 */
export function LanguageSheet({ open, onClose }) {
  const { t, language } = useI18n();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const frame = typeof document === "undefined" ? null : document.querySelector("[data-app-frame]");

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !frame) return null;

  return createPortal(
    <div className={DESKTOP_OVERLAY}>
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-sheet-title"
        className={cn(
          "animate-slide-up relative flex w-full flex-col overflow-hidden rounded-t-[2.25rem] bg-white pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-m3",
          DESKTOP_OVERLAY_CARD,
          "lg:w-[min(28rem,90vw)]"
        )}
      >
        <h3
          id="language-sheet-title"
          className="shrink-0 px-6 text-center font-heading text-[1.25rem] font-bold text-[#111]"
        >
          {t("selectLanguage")}
        </h3>

        <div
          role="radiogroup"
          aria-labelledby="language-sheet-title"
          className="mt-5 flex flex-col gap-3.5 px-5 pb-2"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const active = language === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setLanguage(option.id);
                  onClose?.();
                }}
                className={cn(
                  "flex items-center gap-4 rounded-[1.5rem] bg-gradient-to-r px-3.5 py-3.5 text-left transition-transform active:scale-[0.99]",
                  option.cardGradient,
                  active ? "ring-2 ring-[#111] ring-offset-2" : "ring-0"
                )}
              >
                <span
                  className={cn(
                    "grid size-14 shrink-0 place-items-center rounded-[1.15rem] text-[1.55rem] font-medium text-white",
                    option.iconBg
                  )}
                >
                  {option.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-[1.1rem] font-bold leading-tight text-[#111]">
                    {option.nativeLabel}
                  </span>
                  <span className="mt-1 block text-[0.95rem] font-medium leading-tight text-[#555]">
                    {option.englishLabel}
                  </span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center" aria-hidden>
                  {active ? (
                    <span className="grid size-8 place-items-center rounded-full bg-[#111] text-white">
                      <svg viewBox="0 0 24 24" className="size-5" fill="none">
                        <path
                          d="M6 12.5 10 16.5 18 8.5"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="size-[1.35rem] rounded-full border-[1.5px] border-[#C4C4C4]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    frame
  );
}
