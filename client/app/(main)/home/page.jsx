"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { BrandIcon } from "@/components/common/BrandIcon";
import { FeaturedQuizCard } from "@/components/home/FeaturedQuizCard";
import { QuestionTypeGuide } from "@/components/home/QuestionTypeGuide";
import { QuestionTypeGrid } from "@/components/home/QuestionTypeGrid";
import { LeaderboardPreviewCard } from "@/components/landing/LeaderboardList";
import { appConfig } from "@/config/app.config";
import { FEATURED_QUIZ_ID, ROUTES } from "@/config/routes";
import quizzesJson from "@/data/quizzes.json";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { formatTalukaLabel, formatTalukaWeekPill } from "@/lib/format-taluka";
import { useAuthStore } from "@/store/auth.store";

function pickFeaturedQuiz(list) {
  return (
    list?.find((item) => item.featured) ??
    list?.find((item) => item.id === FEATURED_QUIZ_ID) ??
    list?.[0] ??
    null
  );
}

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [guideType, setGuideType] = useState(null);
  // Bundled local JSON — no async load / spinner on Home.
  const quiz = pickFeaturedQuiz(quizzesJson);

  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;
  const startQuiz = () => {
    if (!quiz) return;
    router.push(ROUTES.quiz(quiz.id));
  };

  return (
    <main className="no-scrollbar animate-screen-in flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F2F2F2] pb-6">
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
        <div className="relative z-10 flex flex-col px-3 pt-6 pb-3">
          <div className="flex flex-col items-center">
            <div className="grid size-[4.75rem] place-items-center overflow-hidden rounded-full bg-white shadow-[0_4px_14px_rgb(15_23_42/0.10)]">
              <BrandIcon
                src={BRAND_ICONS.logo}
                alt="G3Q 2.0"
                priority
                className="size-[4.4rem]"
              />
            </div>
            <h1
              className="mt-3 font-heading text-[1.85rem] leading-none font-bold tracking-tight text-white"
              style={{ textShadow: "0 1px 10px rgb(0 0 0 / 0.22)" }}
            >
              {appConfig.name}
            </h1>
            <p className="mt-2.5 rounded-full bg-white/55 px-3.5 py-1.5 font-heading text-[13px] font-medium text-[#111] backdrop-blur-[6px]">
              {formatTalukaWeekPill(user?.taluka, week)}
            </p>
          </div>

          <div className="mt-5">
            {quiz ? <FeaturedQuizCard quiz={quiz} onStart={startQuiz} /> : null}
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
        <div className="mt-3.5">
          <LeaderboardPreviewCard
            talukaLabel={formatTalukaLabel(user?.taluka)}
            week={week}
            iconColor="#000000"
            onClick={() => router.push(ROUTES.leaderboard)}
          />
        </div>
      </div>
    </main>
  );
}
