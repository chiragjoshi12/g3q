"use client";

import { useRouter } from "next/navigation";

import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { FeaturedQuizCard } from "@/components/home/FeaturedQuizCard";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { ContentWidth } from "@/components/layout/ContentWidth";
import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { quizController } from "@/controllers/quiz.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { QUIZ_PHASE, useQuizStore } from "@/store/quiz.store";

export default function HomePage() {
  const router = useRouter();

  const savedQuizId = useQuizStore((state) => state.quizId);
  const savedPhase = useQuizStore((state) => state.phase);

  const { status, data: quizzes, error, reload } = useAsyncData(
    () => quizController.listQuizzes(),
    []
  );

  const list = quizzes ?? [];

  return (
    <main className="no-scrollbar animate-screen-in flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F5F7F9]">
      <div className="relative overflow-hidden px-5 pt-5 pb-7 sm:px-6">
        <AuroraWash className="inset-0 h-full" />
        <h1 className="relative font-heading text-[1.75rem] leading-tight font-bold tracking-tight text-[#111]">
          {appConfig.name}
        </h1>
      </div>

      <ContentWidth
        size="phone"
        className="px-5 pt-5 pb-8 sm:px-6 md:max-w-none"
      >
        <h2 className="font-heading text-[1.2rem] font-bold text-[#111]">
          Today&apos;s special Quiz
        </h2>

        <div className="mt-4 md:mt-5">
          {status === "loading" ? <LoadingState /> : null}
          {status === "error" ? <ErrorState message={error} onRetry={reload} /> : null}

          {status === "ready" ? (
            <div className="grid gap-4 md:gap-5">
              {list.map((quiz) => {
                const resuming =
                  savedQuizId === quiz.id && savedPhase !== QUIZ_PHASE.COMPLETED;

                return (
                  <FeaturedQuizCard
                    key={quiz.id}
                    quiz={quiz}
                    resuming={resuming}
                    onStart={() => router.push(ROUTES.quiz(quiz.id))}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </ContentWidth>
    </main>
  );
}
