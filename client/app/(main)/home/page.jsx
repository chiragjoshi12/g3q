"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { BrandIcon } from "@/components/common/BrandIcon";
import { FeaturedQuizCard } from "@/components/home/FeaturedQuizCard";
import { QuizPersonalizationOverlay } from "@/components/home/QuizPersonalizationOverlay";
import { QuestionTypeGuide } from "@/components/home/QuestionTypeGuide";
import { QuestionTypeGrid } from "@/components/home/QuestionTypeGrid";
import { LeaderboardPreviewCard } from "@/components/landing/LeaderboardList";
import { appConfig } from "@/config/app.config";
import { FEATURED_QUIZ_ID, PLAY_QUIZ_ID, ROUTES } from "@/config/routes";
import quizzesJson from "@/data/quizzes.json";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { attemptRepository } from "@/lib/data/repositories/attempt.repository";
import { formatTalukaLabel, formatTalukaWeekPill } from "@/lib/format-taluka";
import { useAuthStore } from "@/store/auth.store";

function pickFeaturedQuiz(list) {
  return (
    list?.find((item) => item.featured) ??
    list?.find((item) => item.id === PLAY_QUIZ_ID) ??
    list?.find((item) => item.id === FEATURED_QUIZ_ID) ??
    list?.[0] ??
    null
  );
}

/** Latest finished attempt for this quiz (skips abandoned early exits). */
function pickQuizScore(attempts, quizId) {
  if (!quizId || !Array.isArray(attempts)) return null;
  const match = attempts.find(
    (attempt) => attempt.quizId === quizId && !attempt.abandoned
  );
  if (!match) return null;
  return {
    correctCount: Number(match.correctCount) || 0,
    totalQuestions: Number(match.totalQuestions) || 0,
  };
}

export default function HomePage() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const user = useAuthStore((state) => state.user);
  const [guideType, setGuideType] = useState(null);
  const [preparingQuiz, setPreparingQuiz] = useState(false);
  const quiz = pickFeaturedQuiz(quizzesJson);

  const { data: attempts } = useAsyncData(
    () => attemptRepository.list(user?.id),
    [user?.id],
    hydrated && Boolean(user?.id)
  );

  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;
  const score = pickQuizScore(attempts, quiz?.id);

  const startQuiz = () => {
    if (!quiz || preparingQuiz) return;
    setPreparingQuiz(true);
  };

  return (
    <main
      className="no-scrollbar animate-screen-in flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F2F2F2] pb-32"
      aria-busy={preparingQuiz}
    >
      <section className="relative mx-1 mt-1 overflow-hidden rounded-[1.75rem]">
        <Image
          src="/new-gradient-bg.png"
          alt=""
          width={414}
          height={658}
          priority
          sizes="100vw"
          className="pointer-events-none absolute inset-x-0 top-0 h-auto w-full select-none"
        />
        <div className="relative z-10 flex flex-col px-3 pt-6 pb-1.5">
          <div className="flex flex-col items-center">
            <div className="mt-6 mb-3 grid size-[4.75rem] place-items-center overflow-hidden rounded-full bg-white">
              <BrandIcon
                src={BRAND_ICONS.logo}
                alt="G3Q 2.0"
                priority
                className="size-[4.4rem]"
              />
            </div>
            <h1 className="mt-1 font-heading text-[1.5rem] leading-none font-bold tracking-tight text-white">
              {appConfig.name}
            </h1>
            <p className="mt-[1.5rem] mb-3 w-[60%] rounded-full bg-white/55 px-3.5 py-1.5 text-center font-heading text-[14px] font-medium text-[#111] backdrop-blur-[6px]">
              {formatTalukaWeekPill(user?.taluka, week)}
            </p>
          </div>

          <div className="mt-5">
            {quiz ? (
              <FeaturedQuizCard quiz={quiz} onStart={startQuiz} score={score} />
            ) : null}
          </div>
        </div>
      </section>

      <div className="px-3.5">
        <QuestionTypeGrid onSelect={setGuideType} />
        <QuestionTypeGuide
          typeId={guideType}
          open={Boolean(guideType)}
          onClose={() => setGuideType(null)}
        />
        <div className="mt-7.5">
          <LeaderboardPreviewCard
            talukaLabel={formatTalukaLabel(user?.taluka)}
            week={week}
            iconColor="#2d689d"
            onClick={() => router.push(ROUTES.leaderboard)}
          />
        </div>
      </div>

      {preparingQuiz && quiz
        ? createPortal(
            <QuizPersonalizationOverlay
              name={user?.name}
              taluka={user?.taluka}
              onComplete={() => router.push(ROUTES.quiz(quiz.id))}
            />,
            document.body
          )
        : null}
    </main>
  );
}
