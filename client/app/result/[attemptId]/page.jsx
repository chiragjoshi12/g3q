"use client";

import { Suspense, use } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";

import { ACTION_BUTTON_CLASS, AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { ScoreSummary } from "@/components/result/ScoreSummary";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { quizController } from "@/controllers/quiz.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { AppError, ERROR_CODE } from "@/lib/core/errors";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Result screen: score, certificate, leaderboard, and home action.
 */
export default function ResultPage({ params }) {
  return (
    <Suspense
      fallback={
        <DesktopAppShell>
          <LoadingState className="flex-1" />
        </DesktopAppShell>
      }
    >
      <ResultScreen params={params} />
    </Suspense>
  );
}

function ResultScreen({ params }) {
  const { attemptId } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const practice = usePracticeMode();
  const { ready, isAuthenticated } = useAuthGuard({ optional: practice });

  const { status, data, error, reload } = useAsyncData(
    async () => {
      const attempt = await quizController.getAttempt(attemptId, { practice });
      if (!attempt) {
        throw new AppError(ERROR_CODE.NOT_FOUND, t("errorNotFound"));
      }
      if (practice || appConfig.dataSource !== DATA_SOURCE.REST) {
        const bundle =
          practice && appConfig.dataSource === DATA_SOURCE.REST
            ? await quizController.loadPracticeBundle({ quizId: attempt.quizId })
            : await quizController.loadBundle(attempt.quizId);
        return { attempt, bundle };
      }
      return { attempt, bundle: null };
    },
    [attemptId, practice],
    ready
  );

  const attempt = data?.attempt ?? null;
  const bundle = data?.bundle ?? null;
  const leaveTo = practice && !isAuthenticated ? ROUTES.welcome : ROUTES.home;
  const subtitle = bundle?.quiz?.title || attempt?.quizTitle;

  return (
    <DesktopAppShell className="bg-[#F4F4F4] font-canva">
      <main className="no-scrollbar relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="relative flex min-h-full flex-col pb-[6.75rem] lg:pb-16">
          <AuroraWash
            src="/result-top-gradient-bg.png"
            className="h-52 lg:hidden"
            imageClassName="object-cover object-top"
            unoptimized
          />

          <header className="relative z-10 shrink-0 px-5 pt-4 pb-8 sm:px-6 lg:px-10 lg:pt-8 lg:pb-4">
            <div className="mx-auto flex w-full max-w-[26.5rem] items-center gap-3 md:max-w-none lg:max-w-[40rem]">
              <button
                type="button"
                onClick={() => router.replace(leaveTo)}
                aria-label={t("close")}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgb(15_23_42/0.08)] transition-transform active:scale-95 lg:hidden"
              >
                <X className="size-4 text-[#111]" strokeWidth={2.2} />
              </button>
              <div className="min-w-0 lg:text-center lg:w-full">
                <h1 className="font-canva text-[1.25rem] leading-tight font-bold text-[#111] lg:text-[2rem] lg:text-[#2d689d]">
                  {t("resultScore")}
                </h1>
                {subtitle ? (
                  <p className="mt-0.5 truncate font-canva text-sm font-normal text-[#111] lg:text-[15px]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-6 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-[26.5rem] md:max-w-none lg:max-w-[40rem]">
              {status === "loading" ? <LoadingState label={t("resultPreparing")} /> : null}
              {status === "error" ? <ErrorState message={error} onRetry={reload} /> : null}
              {status === "ready" && attempt ? (
                <>
                  <ScoreSummary attempt={attempt} quiz={bundle?.quiz} />
                  <div className="mt-6 hidden items-center justify-center gap-3 lg:flex">
                    <AppButton
                      className={cn(
                        ACTION_BUTTON_CLASS,
                        "w-auto min-w-0 px-9 shadow-[0_8px_22px_rgb(45_104_157/0.28)]"
                      )}
                      onClick={() => router.replace(leaveTo)}
                    >
                      {t("homePage")}
                    </AppButton>
                    <button
                      type="button"
                      aria-label="G3Q AI"
                      onClick={() => router.push(ROUTES.g3qAi)}
                      className="grid size-14 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_22px_rgb(15_23_42/0.16)] transition-transform active:scale-95"
                    >
                      <BrandIcon src={BRAND_ICONS.navG3qAi} alt="" className="size-7" />
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <nav
        aria-label="Result actions"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 lg:hidden"
      >
        <div className="pointer-events-auto px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-[26.5rem] items-center justify-center gap-3 md:max-w-none">
            <AppButton
              className={cn(
                ACTION_BUTTON_CLASS,
                "w-auto min-w-0 px-9 shadow-[0_8px_22px_rgb(45_104_157/0.28)]"
              )}
              onClick={() => router.replace(leaveTo)}
            >
              {t("homePage")}
            </AppButton>
            <button
              type="button"
              aria-label="G3Q AI"
              onClick={() => router.push(ROUTES.g3qAi)}
              className="grid size-14 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_22px_rgb(15_23_42/0.16)] transition-transform active:scale-95"
            >
              <BrandIcon src={BRAND_ICONS.navG3qAi} alt="" className="size-7" />
            </button>
          </div>
        </div>
      </nav>
    </DesktopAppShell>
  );
}
