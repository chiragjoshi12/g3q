"use client";

import { Suspense, use } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";

import {
  ACTION_BUTTON_CLASS,
  ACTION_BUTTON_SECONDARY_CLASS,
  AppButton,
} from "@/components/common/AppButton";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreSummary } from "@/components/result/ScoreSummary";
import { ROUTES } from "@/config/routes";
import { quizController } from "@/controllers/quiz.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { AppError, ERROR_CODE } from "@/lib/core/errors";
import { useQuizStore } from "@/store/quiz.store";

/**
 * Result screen: score, certificate, and retry / home actions.
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
  const resetSession = useQuizStore((state) => state.resetSession);

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

  const handleRetry = () => {
    const quizId = attempt?.quizId;
    resetSession();
    if (quizId) router.replace(ROUTES.quiz(quizId, { practice }));
  };

  const subtitle = bundle?.quiz?.subtitle || attempt?.quizTitle;

  return (
    <AppShell className="bg-[#F2F2F2] font-canva">
      <header className="shrink-0 px-5 pt-4 pb-2 sm:px-6">
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
              <p className="mt-0.5 truncate font-canva text-sm text-[#111]">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
        <div className="mx-auto w-full max-w-[26.5rem] py-3 md:max-w-none">
          {status === "loading" ? <LoadingState label="પરિણામ તૈયાર થઈ રહ્યું છે…" /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={reload} /> : null}

          {status === "ready" && attempt ? (
            <ScoreSummary attempt={attempt} quiz={bundle?.quiz} />
          ) : null}
        </div>
      </main>

      {status === "ready" && attempt ? (
        <footer className="shrink-0 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="mx-auto flex w-full max-w-[26.5rem] flex-col items-center gap-2.5 md:max-w-none">
            <AppButton onClick={handleRetry} className={ACTION_BUTTON_CLASS}>
              Try again
            </AppButton>
            <AppButton
              variant="outline"
              onClick={() => router.replace(leaveTo)}
              className={ACTION_BUTTON_SECONDARY_CLASS}
            >
              Home page
            </AppButton>
          </div>
        </footer>
      ) : null}
    </AppShell>
  );
}
