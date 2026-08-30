"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Bottom confirmation sheet: icon, title, body, then ના / હા.
 * Portals into the app frame so it stays inside the phone chrome.
 */
export function ConfirmSheet({ open, icon: Icon, title, description, onCancel, onConfirm }) {
  const [frame, setFrame] = useState(() =>
    typeof document === "undefined" ? null : document.querySelector("[data-app-frame]")
  );

  useEffect(() => {
    setFrame(document.querySelector("[data-app-frame]"));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !frame) return null;

  return createPortal(
    <div className="absolute inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="રદ કરો"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        aria-describedby="confirm-sheet-desc"
        className="animate-slide-up relative mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] overflow-hidden rounded-[1.75rem] bg-[#F3F3F3] shadow-m3"
      >
        <div className="flex flex-col items-center px-7 pt-7 pb-5 text-center">
          {Icon ? (
            <Icon className="size-8 text-[#3A3A3A]" strokeWidth={1.8} />
          ) : null}
          <h3
            id="confirm-sheet-title"
            className="mt-3 font-heading text-[1.15rem] font-bold text-[#111]"
          >
            {title}
          </h3>
          <p
            id="confirm-sheet-desc"
            className="mt-2 text-[14px] leading-relaxed text-[#4B5563]"
          >
            {description}
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-[#E4E4E4]">
          <button
            type="button"
            onClick={onCancel}
            className="py-3.5 text-center text-[1.05rem] font-bold text-[#111] transition-colors hover:bg-black/[0.03] active:bg-black/[0.05]"
          >
            ના
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "border-l border-[#E4E4E4] py-3.5 text-center text-[1.05rem] font-bold text-[#111]",
              "transition-colors hover:bg-black/[0.03] active:bg-black/[0.05]"
            )}
          >
            હા
          </button>
        </div>
      </div>
    </div>,
    frame
  );
}
