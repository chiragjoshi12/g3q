"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { BrandIcon } from "@/components/common/BrandIcon";
import { ErrorState } from "@/components/common/StateViews";
import { FeaturedQuizCard } from "@/components/home/FeaturedQuizCard";
import { QuizPersonalizationOverlay } from "@/components/home/QuizPersonalizationOverlay";
import { QuestionTypeGuide } from "@/components/home/QuestionTypeGuide";
import { QuestionTypeGrid } from "@/components/home/QuestionTypeGrid";
import { LeaderboardPreviewCard } from "@/components/landing/LeaderboardList";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { FEATURED_QUIZ_ID, PLAY_QUIZ_ID, ROUTES } from "@/config/routes";
import { quizController } from "@/controllers/quiz.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { attemptRepository } from "@/lib/data/repositories/attempt.repository";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { getDataSource } from "@/lib/data/sources";
import { useI18n } from "@/lib/i18n";
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

/** Latest finished attempt score (REST or local). */
function pickQuizScore(attempts, quizId, currentWeek) {
  if (!Array.isArray(attempts) || !attempts.length) return null;
  const finished = attempts.find((attempt) => !attempt.abandoned) || attempts[0];
  if (!finished) return null;
  return {
    correctCount: Number(finished.correctCount) || 0,
    totalQuestions: Number(finished.totalQuestions) || 0,
  };
}

export default function HomePage() {
  const router = useRouter();
  const { language, appName } = useI18n();
  const hydrated = useStoreHydrated(useAuthStore);
  const user = useAuthStore((state) => state.user);
  const [guideType, setGuideType] = useState(null);
  const [preparingQuiz, setPreparingQuiz] = useState(false);
  const [nextQuizPath, setNextQuizPath] = useState(null);
  const [overlayDone, setOverlayDone] = useState(false);
  const usingRest = appConfig.dataSource === DATA_SOURCE.REST;

  const {
    status: quizzesStatus,
    data: quizzes = [],
    error: quizzesError,
    reload: reloadQuizzes,
  } = useAsyncData(() => quizController.listQuizzes(), [], !usingRest);
  const {
    data: landingSummary,
    error: landingError,
    reload: reloadLanding,
  } = useAsyncData(() => getDataSource().getLandingSummary(), [], usingRest);
  const quiz = usingRest
    ? {
        id: landingSummary?.featuredQuizId || PLAY_QUIZ_ID,
        title: landingSummary?.playTitle || appName,
        subtitle: landingSummary?.playSubtitle || "",
        totalQuestions: Number(landingSummary?.playQuestionCount ?? 15),
      }
    : pickFeaturedQuiz(quizzes);

  const { data: sessionSummary } = useAsyncData(
    () => (usingRest ? attemptRepository.currentWeek(user?.id) : null),
    [user?.id],
    hydrated && Boolean(user?.id) && usingRest
  );
  const { data: attemptHistory } = useAsyncData(
    () => (user?.id ? attemptRepository.list(user.id) : Promise.resolve([])),
    [user?.id],
    hydrated && Boolean(user?.id)
  );

  const week = Number(landingSummary?.week) || appConfig.certificate.week || 5;
  const attempts = attemptHistory ?? [];
  const currentWeek = usingRest ? Number(sessionSummary?.currentWeek) || week : week;
  // Always allow another play. In-progress sessions are resumed by startSession.
  const showPlayAction = true;
  const score = pickQuizScore(attempts, quiz?.id, currentWeek);

  useEffect(() => {
    if (preparingQuiz && overlayDone && nextQuizPath) {
      router.push(nextQuizPath);
    }
  }, [preparingQuiz, overlayDone, nextQuizPath, router]);

  const startQuiz = async () => {
    if (!quiz || preparingQuiz) return;
    setPreparingQuiz(true);
    setOverlayDone(false);
    setNextQuizPath(null);
    try {
      if (usingRest) {
        const session = await quizController.startSession({ language });
        setNextQuizPath(ROUTES.quiz(session.sessionId));
        return;
      }
      setNextQuizPath(ROUTES.quiz(quiz.id));
    } catch {
      setPreparingQuiz(false);
      setNextQuizPath(null);
    }
  };

  return (
    <>
      <main
        className="no-scrollbar animate-screen-in flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F2F2F2] pb-32 lg:hidden"
        aria-busy={preparingQuiz}
      >
        <section className="relative mx-1 mt-1.5 overflow-hidden rounded-[1.75rem]">
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
                  alt={appName}
                  priority
                  className="size-[4.4rem]"
                />
              </div>
              <h1 className="mt-1 font-heading text-[1.5rem] leading-none font-bold tracking-tight text-white">
                {appName}
              </h1>
              <p className="mt-[1.5rem] mb-3 w-[60%] rounded-full bg-white/55 px-3.5 py-1.5 text-center font-heading text-[14px] font-medium text-[#111] backdrop-blur-[6px]">
                {formatTalukaWeekPill(user?.taluka, week, language)}
              </p>
            </div>

            <div className="mt-5">
              {((!usingRest && quizzesStatus === "error") || (usingRest && landingError)) ? (
                <ErrorState
                  message={usingRest ? landingError : quizzesError}
                  onRetry={usingRest ? reloadLanding : reloadQuizzes}
                  className="py-8"
                />
              ) : null}
              {quiz ? (
                <FeaturedQuizCard
                  quiz={quiz}
                  onStart={startQuiz}
                  score={score}
                  showPlayAction={showPlayAction}
                />
              ) : null}
            </div>
          </div>
        </section>

        <div className="px-3.5">
          <QuestionTypeGrid onSelect={setGuideType} />
          <div className="mt-7.5">
            <LeaderboardPreviewCard
              talukaLabel={formatTalukaLabel(user?.taluka, language)}
              week={week}
              iconColor="#2d689d"
              onClick={() => router.push(ROUTES.leaderboard)}
            />
          </div>
        </div>
      </main>

      <main
        className="no-scrollbar relative z-10 hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain lg:block"
        aria-busy={preparingQuiz}
      >
        <div className="mx-auto w-full max-w-[56rem] px-10 pt-8 pb-16 xl:max-w-[64rem] xl:px-14">
          <div className="flex flex-col items-center">
            <div className="grid size-[5.25rem] place-items-center overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgb(15_23_42/0.08)]">
              <BrandIcon
                src={BRAND_ICONS.logo}
                alt={appName}
                priority
                className="size-[4.9rem]"
              />
            </div>
            <h1 className="mt-4 font-heading text-[2.35rem] leading-none font-bold tracking-tight text-[#2d689d]">
              {appName}
            </h1>
            <p className="mt-4 rounded-full border border-[#E4E6EA] bg-white px-5 py-2 text-center font-heading text-[15px] font-medium text-[#111]">
              {formatTalukaWeekPill(user?.taluka, week, language)}
            </p>
          </div>

          <div className="mt-8">
            {((!usingRest && quizzesStatus === "error") || (usingRest && landingError)) ? (
              <ErrorState
                message={usingRest ? landingError : quizzesError}
                onRetry={usingRest ? reloadLanding : reloadQuizzes}
                className="py-8"
              />
            ) : null}
            {quiz ? (
              <FeaturedQuizCard
                wide
                quiz={quiz}
                onStart={startQuiz}
                score={score}
                showPlayAction={showPlayAction}
              />
            ) : null}
          </div>

          <QuestionTypeGrid wide onSelect={setGuideType} />
        </div>
      </main>

      <QuestionTypeGuide
        typeId={guideType}
        open={Boolean(guideType)}
        onClose={() => setGuideType(null)}
      />

      {preparingQuiz && quiz
        ? createPortal(
            <QuizPersonalizationOverlay
              name={user?.name}
              taluka={user?.taluka}
              onComplete={() => setOverlayDone(true)}
            />,
            document.body
          )
        : null}
    </>
  );
}
