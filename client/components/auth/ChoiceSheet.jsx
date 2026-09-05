"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Bottom sheet with a radio list. Portals into the app frame so the dim
 * stays inside the phone chrome.
 */
export function ChoiceSheet({ open, title, options, value, onSelect, onClose }) {
  const [frame, setFrame] = useState(() =>
    typeof document === "undefined" ? null : document.querySelector("[data-app-frame]")
  );

  useEffect(() => {
    setFrame(document.querySelector("[data-app-frame]"));
  }, []);

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
    <div className="absolute inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="બંધ કરો"
        onClick={onClose}
        className="absolute inset-0 bg-black/35"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="choice-sheet-title"
        className="animate-slide-up relative flex max-h-[78dvh] w-full flex-col overflow-hidden rounded-t-[2.25rem] bg-white pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-m3"
      >
        <h3
          id="choice-sheet-title"
          className="shrink-0 px-6 text-center font-heading text-[1.25rem] font-bold text-[#111]"
        >
          {title}
        </h3>
        <div
          role="radiogroup"
          aria-labelledby="choice-sheet-title"
          className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4"
        >
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(option)}
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
                <span className="font-heading text-[1.05rem] text-[#111]">{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    frame
  );
}
