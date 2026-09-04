"use client";

import { Suspense, use } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";

import { AppButton } from "@/components/common/AppButton";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { AppShell } from "@/components/layout/AppShell";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { ScoreSummary } from "@/components/result/ScoreSummary";
import { ROUTES } from "@/config/routes";
import { quizController } from "@/controllers/quiz.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { AppError, ERROR_CODE } from "@/lib/core/errors";

/**
 * Result screen: score, certificate, leaderboard, and home action.
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
  const subtitle = bundle?.quiz?.title || attempt?.quizTitle;

  return (
    <AppShell className="bg-[#F4F4F4] font-canva">
      <main className="no-scrollbar relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="relative flex min-h-full flex-col">
          <AuroraWash
            src="/result-top-gradient-bg.png"
            className="h-52"
            imageClassName="object-cover object-top"
            unoptimized
          />

          <header className="relative z-10 shrink-0 px-5 pt-4 pb-8 sm:px-6">
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

          <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-6 sm:px-6">
            <div className="mx-auto flex w-full max-w-[26.5rem] flex-1 flex-col md:max-w-none">
              {status === "loading" ? <LoadingState label="પરિણામ તૈયાર થઈ રહ્યું છે…" /> : null}
              {status === "error" ? <ErrorState message={error} onRetry={reload} /> : null}

              {status === "ready" && attempt ? (
                <>
                  <ScoreSummary attempt={attempt} quiz={bundle?.quiz} />
                  <footer className="mt-auto flex justify-center pt-8 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
                    <AppButton block onClick={() => router.replace(leaveTo)}>
                      Home page
                    </AppButton>
                  </footer>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
