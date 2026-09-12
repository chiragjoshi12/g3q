"use client";

import Image from "next/image";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";

const FEATURED_IMAGE = "/home/quiz-banner.jpeg";

/**
 * Home featured quiz: photo, title row with share, question count +
 * Play Quiz — or "Your Score - X/Y" once the user has already played.
 */
export function FeaturedQuizCard({ quiz, onStart, score = null, wide = false, showPlayAction = true }) {
  const { t } = useI18n();
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

  const hasScore =
    score &&
    Number.isFinite(score.correctCount) &&
    Number.isFinite(score.totalQuestions);

  const scoreLabel = hasScore
    ? `${t("scoreLabel")}: ${score.correctCount}/${score.totalQuestions}`
    : null;

  if (wide) {
    return (
      <article className="relative overflow-hidden rounded-[1.85rem] bg-white shadow-[0_12px_36px_rgb(15_23_42/0.08)]">
        <div className="grid grid-cols-[1.08fr_1fr] items-stretch gap-6 p-5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-[#d9d9d9]">
            <Image
              src={FEATURED_IMAGE}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 28rem, 40vw"
              className="object-cover grayscale"
            />
          </div>

          <div className="relative flex min-h-0 flex-col py-1 pr-1">
            <button
              type="button"
              onClick={share}
              aria-label={t("share")}
              className="absolute top-0 right-0 grid size-10 place-items-center rounded-full bg-[#F0F1F3] transition-transform active:scale-95"
            >
              <BrandIcon src={BRAND_ICONS.shareQuiz} alt="" className="size-[18px]" />
            </button>

            <h3 className="font-heading pr-12 text-[1.55rem] leading-snug font-bold text-[#111]">
              {quiz.title}
            </h3>
            {quiz.subtitle ? (
              <p className="mt-5 font-heading text-[1.05rem] leading-snug text-[#111]">
                {quiz.subtitle}
              </p>
            ) : null}

            <p className="mt-5 flex items-center gap-2.5 font-heading text-[15px] font-medium text-[#111]">
              <BrandIcon
                src={BRAND_ICONS.questionsCount}
                alt=""
                className="size-7 shrink-0"
              />
              {quiz.totalQuestions} {t("questions")}
            </p>

            <div className="absolute top-[12rem] left-0">
              {showPlayAction ? (
                <button
                  type="button"
                  onClick={onStart}
                  className="flex h-17 w-full items-center justify-start gap-3 rounded-full bg-[#2d689d] px-13 font-heading text-[1.2rem] font-bold text-white transition-transform active:scale-[0.98]"
                >
                  <span
                    aria-hidden
                    className="block size-5.5 shrink-0 bg-white"
                    style={{
                      WebkitMaskImage: `url(${BRAND_ICONS.navPlayQuiz})`,
                      maskImage: `url(${BRAND_ICONS.navPlayQuiz})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                  {t("playQuiz")}
                </button>
              ) : hasScore ? (
                <div className="flex h-17 w-full items-center justify-start rounded-full bg-[#E8F0F7] px-6 font-heading text-[1.05rem] font-bold text-[#2d689d]">
                  {scoreLabel}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    // move entire box on above side of the screen
    <article className="mx-[-6px] mt-[-10px] overflow-hidden rounded-[1.5rem] bg-white shadow-[0_10px_28px_rgb(15_23_42/0.10)]">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#d9d9d9]">
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
          <div className="min-w-0 flex-1 translate-x-1.5">
            <h3 className="font-heading text-[16px] leading-snug font-bold text-[#111]">
              {quiz.title}
            </h3>
            {quiz.subtitle ? (
              <p className="mt-2 font-heading text-[14px] leading-snug text-[#000000]">
                {quiz.subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={share}
            aria-label={t("share")}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F0F1F3] transition-transform active:scale-95"
          >
            <BrandIcon src={BRAND_ICONS.shareQuiz} alt="" className="size-[18px]" />
          </button>
        </div>

        <div className="mt-3.5 -mx-4 flex items-end justify-between gap-3 border-t border-[#E8EAED] px-4 pt-3.5">
          <p className="flex translate-x-2 items-center gap-2.5 font-heading text-[14px] font-medium text-[#111]">
            <BrandIcon
              src={BRAND_ICONS.questionsCount}
              alt=""
              className="size-7 shrink-0"
            />
            {quiz.totalQuestions} {t("questions")}
          </p>

          <div className="flex flex-col items-end gap-1.5">
            {showPlayAction ? (
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#2d689d] px-4.5 font-heading text-[16px] font-bold text-white transition-transform active:scale-[0.98]"
              >
                <span
                  aria-hidden
                  className="block size-3.5 shrink-0 bg-white"
                  style={{
                    WebkitMaskImage: `url(${BRAND_ICONS.navPlayQuiz})`,
                    maskImage: `url(${BRAND_ICONS.navPlayQuiz})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
                {t("playQuiz")}
              </button>
            ) : hasScore ? (
              <div className="inline-flex h-10 items-center rounded-full bg-[#E8F0F7] px-4.5 font-heading text-[14px] font-bold text-[#2d689d]">
                {scoreLabel}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
