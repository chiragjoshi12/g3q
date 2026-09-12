"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { ACTION_BUTTON_CLASS, ActionButtonRow, AppButton } from "@/components/common/AppButton";
import { SheetCloseButton } from "@/components/common/SheetCloseButton";
import { DESKTOP_OVERLAY, DESKTOP_OVERLAY_CARD } from "@/components/layout/desktop-overlay";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const GUIDE_IMAGE = "/home/guide-question-type.jpg";
const GUIDE_MEDIA = {
  mcq: { kind: "image", src: "/gif/mcq.gif" },
  truefalse: { kind: "video", src: "/gif/true-false.mp4" },
  blanks: { kind: "image", src: "/gif/fill-blanks.gif" },
  match: { kind: "image", src: "/gif/match-pair.gif" },
};

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
  const media = GUIDE_MEDIA[typeId] ?? null;
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
          "animate-slide-up relative flex h-[38rem] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white px-4 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-m3",
          DESKTOP_OVERLAY_CARD,
          "lg:h-[45rem] lg:w-[min(35rem,92vw)] lg:max-h-[min(40rem,86dvh)] lg:px-5 lg:pt-5 lg:pb-5"
        )}
      >
        <SheetCloseButton onClick={onClose} />
        <h3
          id="question-type-guide-title"
          className="px-10 text-center font-heading text-[1.45rem] font-bold leading-tight lg:text-[1.25rem]"
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
          className="mt-3 min-h-[2.6rem] whitespace-pre-line text-center font-heading text-[15px] leading-normal tracking-[-0.01em] text-[#222] lg:min-h-[2.25rem] lg:text-[15px]"
        >
          {guide.body}
        </p>
        <div className="relative mt-[10] min-h-0 w-full flex-1 overflow-hidden rounded-[1.15rem] p-2 lg:mt-3">
          {media?.kind === "video" ? (
            <video
              src={media.src}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <Image
              src={media?.src ?? GUIDE_IMAGE}
              alt=""
              fill
              unoptimized={Boolean(media?.src?.endsWith(".gif"))}
              sizes="(max-width: 1024px) 22.5rem, 26rem"
              className="object-contain p-2"
            />
          )}
        </div>
        <ActionButtonRow className="mt-4">
          <AppButton className={cn(ACTION_BUTTON_CLASS, "lg:!w-[14rem]")} onClick={onClose}>
            {t("understood")}
          </AppButton>
        </ActionButtonRow>
      </div>
    </div>,
    frame
  );
}
