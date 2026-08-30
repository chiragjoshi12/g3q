"use client";

import Image from "next/image";

import { AppButton } from "@/components/common/AppButton";

/** Home quiz card: inset banner, overlay title, and a Play Quiz action. */
export function FeaturedQuizCard({ quiz, onStart, resuming = false }) {
  if (!quiz) return null;

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-[#EFEFEF] p-3 pb-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.15rem] bg-primary-900">
        {quiz.banner ? (
          <Image
            src={quiz.banner}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 42rem, 48rem"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />

        <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 font-heading text-[11px] font-semibold tracking-wide text-white backdrop-blur-[2px]">
          {quiz.totalQuestions} પ્રશ્નો
        </span>

        <div className="absolute inset-x-0 bottom-0 p-3.5 pr-16">
          <h3 className="font-heading text-[1.05rem] leading-snug font-bold text-white">
            {quiz.title}
          </h3>
          {quiz.subtitle ? (
            <p className="mt-0.5 text-[13px] leading-snug text-white/88">{quiz.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-center px-4 pt-4 pb-2">
        <AppButton
          onClick={onStart}
          className="h-14 w-[86%] bg-[#2d689d] font-heading text-[1.05rem] font-bold hover:bg-[#255a88]"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path d="M8 5.2v13.6L19.2 12 8 5.2z" />
          </svg>
          {resuming ? "Play Quiz" : "Play Quiz"}
        </AppButton>
      </div>
    </article>
  );
}
