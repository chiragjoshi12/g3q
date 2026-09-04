"use client";

import { useEffect } from "react";

import { Check } from "@/components/icons";

/**
 * Top banner. Parent must be the app frame (`relative`) so it sits under the
 * status area without leaving the phone chrome.
 */
export function TopToast({ open, message, onClose, duration = 3200 }) {
  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => onClose?.(), duration);
    return () => window.clearTimeout(id);
  }, [open, duration, onClose]);

  if (!open || !message) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        role="status"
        className="animate-slide-down pointer-events-auto flex w-full max-w-[22rem] items-center gap-2.5 rounded-[1.15rem] bg-white px-3.5 py-3 shadow-[0_10px_28px_rgb(15_23_42/0.16)]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E8F8ED] text-[#15803D]">
          <Check className="size-4" />
        </span>
        <p className="min-w-0 flex-1 font-heading text-[14px] font-semibold leading-snug text-[#111]">
          {message}
        </p>
      </div>
    </div>
  );
}
