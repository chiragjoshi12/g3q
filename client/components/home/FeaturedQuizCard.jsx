"use client";

import Image from "next/image";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";

const FEATURED_IMAGE = "/home/featured-camera.jpg";

/** Home featured quiz: photo, title row with share, question count + Play Quiz. */
export function FeaturedQuizCard({ quiz, onStart }) {
  if (!quiz) return null;

  const share = async () => {
    const url = `${window.location.origin}/quiz/${quiz.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: quiz.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_28px_rgb(15_23_42/0.10)]">
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#d9d9d9]">
        <Image
          src={FEATURED_IMAGE}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 26.5rem"
          className="object-cover grayscale"
        />
      </div>

      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-[1.15rem] leading-snug font-bold text-[#111]">
              {quiz.title}
            </h3>
            {quiz.subtitle ? (
              <p className="mt-0.5 font-heading text-[13px] leading-snug text-[#000000]">
                {quiz.subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={share}
            aria-label="શેર કરો"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F0F1F3] transition-transform active:scale-95"
          >
            <BrandIcon src={BRAND_ICONS.shareQuiz} alt="" className="size-[18px]" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#E8EAED] pt-3.5">
          <p className="flex items-center gap-1.5 font-heading text-[13px] font-medium text-[#111]">
            <BrandIcon src={BRAND_ICONS.questionsCount} alt="" className="size-5 shrink-0" />
            {quiz.totalQuestions} પ્રશ્નો
          </p>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#2d689d] px-4.5 font-heading text-[0.92rem] font-bold text-white transition-transform active:scale-[0.98]"
          >
            <PlayIcon className="size-3.5" />
            Play Quiz
          </button>
        </div>
      </div>
    </article>
  );
}

function PlayIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.2v13.6L19.4 12 8 5.2z" />
    </svg>
  );
}
