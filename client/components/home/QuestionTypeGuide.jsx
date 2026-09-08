"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { DESKTOP_OVERLAY, DESKTOP_OVERLAY_CARD } from "@/components/layout/desktop-overlay";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const GUIDE_IMAGE = "/home/guide-question-type.jpg";

/**
 * Bottom-sheet explainer for a question type. Portals into the app frame so
 * the dim stays inside the phone chrome.
 */
export function QuestionTypeGuide({ typeId, open, onClose }) {
  const { t } = useI18n();
  const guides = {
    mcq: { title: t("mcqGuideTitle"), body: t("mcqGuideBody") },
    truefalse: { title: t("tfGuideTitle"), body: t("tfGuideBody") },
    blanks: { title: t("blanksGuideTitle"), body: t("blanksGuideBody") },
    match: { title: t("matchGuideTitle"), body: t("matchGuideBody") },
    sequence: { title: t("sequenceGuideTitle"), body: t("sequenceGuideBody") },
  };
  const guide = guides[typeId] ?? null;
  const frame = typeof document === "undefined" ? null : document.querySelector("[data-app-frame]");

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !frame || !guide) return null;

  return createPortal(
    <div className={DESKTOP_OVERLAY}>
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-type-guide-title"
        aria-describedby="question-type-guide-body"
        className={cn(
          "animate-slide-up relative w-full overflow-hidden rounded-t-[2rem] bg-white px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-m3",
          DESKTOP_OVERLAY_CARD,
          "lg:w-[min(22rem,88vw)] lg:px-5 lg:pt-5 lg:pb-5"
        )}
      >
        <h3
          id="question-type-guide-title"
          className="text-center font-heading text-[1.45rem] font-bold leading-tight lg:text-[1.25rem]"
          style={{
            backgroundImage: "linear-gradient(90deg, #8c52ff, #00bf63)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {guide.title}
        </h3>
        <p
          id="question-type-guide-body"
          className="mt-3 text-center font-heading text-[14px] leading-[1.65] text-[#222]"
        >
          {guide.body}
        </p>
        <div className="relative mt-4 aspect-[3/2] w-full overflow-hidden rounded-[1.15rem] bg-[#F3F4F6] lg:mt-3 lg:aspect-[16/10] lg:max-h-36">
          <Image
            src={GUIDE_IMAGE}
            alt=""
            fill
            sizes="(max-width: 1024px) 22.5rem, 26rem"
            className="object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#2d689d] font-heading text-[1.05rem] font-bold text-white transition-transform active:scale-[0.98] lg:mt-4 lg:h-11"
        >
          {t("understood")}
        </button>
      </div>
    </div>,
    frame
  );
}
