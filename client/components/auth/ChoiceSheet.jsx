"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { SheetCloseButton } from "@/components/common/SheetCloseButton";
import { DESKTOP_OVERLAY, DESKTOP_OVERLAY_CARD } from "@/components/layout/desktop-overlay";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function normalizeOption(option) {
  if (option && typeof option === "object") {
    return {
      value: String(option.value ?? ""),
      label: String(option.label ?? option.value ?? ""),
    };
  }
  const value = String(option ?? "");
  return { value, label: value };
}

/**
 * Bottom sheet with a radio list. Portals into the app frame so the dim
 * stays inside the phone chrome.
 *
 * `options` may be strings or `{ value, label }` objects. Selection always
 * returns the canonical `value` (stored Gujarati name for geography).
 */
export function ChoiceSheet({ open, title, options, value, onSelect, onClose }) {
  const { t } = useI18n();
  const frame = typeof document === "undefined" ? null : document.querySelector("[data-app-frame]");
  const normalized = (options || []).map(normalizeOption);

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
        aria-labelledby="choice-sheet-title"
        className={cn(
          "animate-slide-up relative flex max-h-[78dvh] w-full flex-col overflow-hidden rounded-t-[2.25rem] bg-white pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-m3",
          DESKTOP_OVERLAY_CARD,
          "lg:w-[min(28rem,90vw)] lg:max-h-[min(32rem,78dvh)]"
        )}
      >
        <SheetCloseButton onClick={onClose} />
        <div className="relative flex shrink-0 items-center justify-center px-14">
          <h3
            id="choice-sheet-title"
            className="text-center font-heading text-[1.25rem] font-bold text-[#111]"
          >
            {title}
          </h3>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="choice-sheet-title"
          className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4"
        >
          {normalized.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(option.value)}
                className="flex w-full items-center gap-4 py-3.5 text-left transition-colors active:bg-[#FAFAFA]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-[1.35rem] shrink-0 place-items-center rounded-full border-[1.5px]",
                    selected ? "border-[#111]" : "border-[#C4C4C4]"
                  )}
                >
                  {selected ? <span className="size-2.5 rounded-full bg-[#111]" /> : null}
                </span>
                <span className="font-heading text-[1.05rem] text-[#111]">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    frame
  );
}
