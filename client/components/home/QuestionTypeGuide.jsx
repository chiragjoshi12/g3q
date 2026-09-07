"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const GUIDE_IMAGE = "/home/guide-question-type.jpg";
import { useI18n } from "@/lib/i18n";

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
    <div className="absolute inset-0 z-[60] flex items-end justify-center">
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
        className="animate-slide-up relative w-full overflow-hidden rounded-t-[2rem] bg-white px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-m3"
      >
        <h3
          id="question-type-guide-title"
          className="text-center font-heading text-[1.45rem] font-bold leading-tight"
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
        <div className="relative mt-4 aspect-[3/2] w-full overflow-hidden rounded-[1.15rem] bg-[#F3F4F6]">
          <Image
            src={GUIDE_IMAGE}
            alt=""
            fill
            sizes="22.5rem"
            className="object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#2d689d] font-heading text-[1.05rem] font-bold text-white transition-transform active:scale-[0.98]"
        >
          {t("understood")}
        </button>
      </div>
    </div>,
    frame
  );
}
