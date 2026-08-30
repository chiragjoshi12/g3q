"use client";

import { Suspense, use } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";

import { ACTION_BUTTON_CLASS, AppButton } from "@/components/common/AppButton";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { AppShell } from "@/components/layout/AppShell";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { QuestionReviewCard } from "@/components/result/QuestionReviewCard";
import { ScoreSummary } from "@/components/result/ScoreSummary";
import { ROUTES } from "@/config/routes";
import { quizController } from "@/controllers/quiz.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { AppError, ERROR_CODE } from "@/lib/core/errors";

/**
 * Result screen: score, certificate, question review, and home action.
 */
export default function ResultPage({ params }) {
  return (
    <Suspense
      fallback={
        <AppShell>
          <LoadingState className="flex-1" />
        </AppShell>
      }
    >
      <ResultScreen params={params} />
    </Suspense>
  );
}

function ResultScreen({ params }) {
  const { attemptId } = use(params);
  const router = useRouter();
  const practice = usePracticeMode();
  const { ready, isAuthenticated } = useAuthGuard({ optional: practice });

  const { status, data, error, reload } = useAsyncData(
    async () => {
      const attempt = await quizController.getAttempt(attemptId);
      if (!attempt) {
        throw new AppError(ERROR_CODE.NOT_FOUND, "આ પરિણામ મળ્યું નથી.");
      }
      const bundle = await quizController.loadBundle(attempt.quizId);
      return { attempt, bundle };
    },
    [attemptId],
    ready
  );

  const attempt = data?.attempt ?? null;
  const bundle = data?.bundle ?? null;
  const leaveTo = practice && !isAuthenticated ? ROUTES.root : ROUTES.home;

  const subtitle = bundle?.quiz?.subtitle || attempt?.quizTitle;

  return (
    <AppShell className="bg-[#F2F2F2] font-canva">
      <main className="no-scrollbar relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="relative flex min-h-full flex-col">
          <div className="relative shrink-0">
            <AuroraWash
              className="h-56"
              imageClassName="object-cover object-[center_38%]"
              unoptimized
            />

            <header className="relative z-10 px-5 pt-4 pb-8 sm:px-6">
              <div className="mx-auto flex w-full max-w-[26.5rem] items-center gap-3 md:max-w-none">
                <button
                  type="button"
                  onClick={() => router.replace(leaveTo)}
                  aria-label="બંધ કરો"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgb(15_23_42/0.08)] transition-transform active:scale-95"
                >
                  <X className="size-4 text-[#111]" strokeWidth={2.2} />
                </button>
                <div className="min-w-0">
                  <h1 className="font-canva text-[1.25rem] leading-tight font-bold text-[#111]">
                    Result - Score
                  </h1>
                  {subtitle ? (
                    <p className="mt-0.5 truncate font-canva text-sm font-normal text-[#111]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </header>
          </div>

          <div className="relative z-10 flex flex-1 flex-col rounded-t-[2rem] bg-white shadow-[0_-6px_20px_rgb(15_23_42/0.04)]">
            <div className="flex-1 px-5 pt-5 pb-6 sm:px-6">
              <div className="mx-auto w-full max-w-[26.5rem] md:max-w-none">
                {status === "loading" ? <LoadingState label="પરિણામ તૈયાર થઈ રહ્યું છે…" /> : null}
                {status === "error" ? <ErrorState message={error} onRetry={reload} /> : null}

                {status === "ready" && attempt ? (
                  <>
                    <ScoreSummary attempt={attempt} quiz={bundle?.quiz} />
                    <QuizReview attempt={attempt} bundle={bundle} />
                  </>
                ) : null}
              </div>
            </div>

            {status === "ready" && attempt ? (
              <footer className="mt-auto shrink-0 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
                <div className="mx-auto flex w-full max-w-[26.5rem] flex-col items-center gap-2.5 md:max-w-none">
                  <AppButton onClick={() => router.replace(leaveTo)} className={ACTION_BUTTON_CLASS}>
                    Home page
                  </AppButton>
                </div>
              </footer>
            ) : null}
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function QuizReview({ attempt, bundle }) {
  const questions = bundle?.questions ?? [];
  const questionsById = Object.fromEntries(questions.map((question) => [question.id, question]));
  const rows = attempt.breakdown ?? [];

  if (rows.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-canva text-[1.2rem] font-bold text-[#111]">Quiz સમીક્ષા</h2>
      <div className="mt-3 space-y-3">
        {rows.map((row, index) => {
          const question = questionsById[row.questionId];
          if (!question) return null;
          return (
            <QuestionReviewCard
              key={row.questionId}
              index={index}
              question={question}
              row={row}
            />
          );
        })}
      </div>
    </section>
  );
}
