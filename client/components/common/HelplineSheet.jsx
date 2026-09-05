"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { BrandIcon } from "@/components/common/BrandIcon";
import { X } from "@/components/icons";
import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { BRAND_ICONS } from "@/lib/brand-icons";

/**
 * Profile helpline bottom sheet. Portals into the app frame so the slight
 * blur stays inside the phone chrome.
 */
export function HelplineSheet({ open, onClose }) {
  const { phone } = appConfig.profile.helpline;
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
        className="absolute inset-0 bg-black/[0.06] backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpline-sheet-title"
        className="animate-slide-up relative w-full overflow-hidden rounded-t-[2.25rem] bg-white px-6 pt-5 pb-[max(2.25rem,env(safe-area-inset-bottom))] shadow-m3"
      >
        <div className="relative flex items-center justify-center">
          <h3
            id="helpline-sheet-title"
            className="font-heading text-[1.35rem] font-bold text-[#111]"
          >
            Helpline
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="બંધ કરો"
            className="absolute right-0 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-[#F1F5F9] text-[#6B7280] transition-transform active:scale-95"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="mt-10 mb-3 flex items-start justify-center gap-16">
          <Link
            href={ROUTES.g3qAi}
            className="flex flex-col items-center gap-3.5 transition-transform active:scale-95"
          >
            <span className="grid size-[5rem] place-items-center rounded-full bg-[#f5f5f5]">
              <BrandIcon src={BRAND_ICONS.navG3qAi} alt="" className="size-12" />
            </span>
            <span className="font-heading text-[1.05rem] font-bold text-[#111]">G3Q AI</span>
          </Link>

          <a
            href={`tel:${phone}`}
            onClick={onClose}
            className="flex flex-col items-center gap-3.5 transition-transform active:scale-95"
          >
            <span className="grid size-[5rem] place-items-center rounded-full bg-[#f5f5f5]">
              <BrandIcon src={BRAND_ICONS.helpline} alt="" className="size-12" />
            </span>
            <span className="font-heading text-[1.05rem] font-bold text-[#111]">
              Call for Help
            </span>
          </a>
        </div>
      </div>
    </div>,
    frame
  );
}
