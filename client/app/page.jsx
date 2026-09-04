"use client";

import { useRouter } from "next/navigation";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BannerSlider } from "@/components/landing/BannerSlider";
import { LandingActionNav } from "@/components/landing/LandingActionNav";
import { LeaderboardPreviewCard } from "@/components/landing/LeaderboardList";
import { AppShell } from "@/components/layout/AppShell";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { appConfig } from "@/config/app.config";
import { FEATURED_QUIZ_ID, ROUTES, setPostAuthPath } from "@/config/routes";
import { ABHIYAN } from "@/data/abhiyan";
import { LANDING_PLAYS_COUNT, LANDING_WEEK_PLAYS_COUNT } from "@/data/leaderboard";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { formatTalukaLabel } from "@/lib/format-taluka";
import { useCountUp } from "@/hooks/useCountUp";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { useAuthStore } from "@/store/auth.store";

const ABOUT_LEAD = [
  "ગુજરાત જ્ઞાન ગુરુ ક્વિઝ (G3Q 2.0) એ શિક્ષણ, જ્ઞાન અને સ્પર્ધાને જોડતી અનોખી પ્રવૃત્તિ છે. રાજ્યના તમામ વિદ્યાર્થીઓ સ્થાન, બોર્ડ, માધ્યમ કે લિંગ ભેદ વગર આ ક્વિઝમાં ભાગ લઈ શકે છે.",
  ABHIYAN.lead,
];

const LANDING_BANNERS = ["/landing/hero.png", "/q3quiz.png"];

export default function LandingPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const talukaLabel = formatTalukaLabel(hydrated ? user?.taluka : null);
  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;
  const playsCount = useCountUp(LANDING_PLAYS_COUNT, { durationMs: 1600 });

  const go = (path) => {
    if (hydrated && isAuthenticated) {
      router.push(path);
      return;
    }
    setPostAuthPath(path);
    router.push(ROUTES.auth);
  };

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F2F2F2]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F2F2F2] md:max-w-none">
        <BrandHeader priority />

        <main className="no-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-2.5 px-2.5 pt-3.5 pb-32">
            {/* Card 1 — white box contains inset banner + text */}
            <section className="rounded-[2rem] bg-white px-2 pt-2 pb-3 sm:px-3 sm:pt-3 sm:pb-8">
              <div>
                <div className="relative overflow-hidden rounded-t-[1.6rem]">
                  <BannerSlider
                    slides={LANDING_BANNERS}
                    className="aspect-[3/2] w-full bg-[#ddd]"
                    sizes="(max-width: 768px) 100vw, 26.5rem"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent via-white/55 to-white"
                  />
                </div>
                <div aria-hidden className="relative mx-1 h-5">
                  <div className="absolute inset-x-0 -top-3 h-9 rounded-[100%] bg-white blur-2xl" />
                  <div className="absolute inset-x-4 top-0 h-px bg-white shadow-[0_14px_28px_12px_rgba(255,255,255,0.95)]" />
                </div>
              </div>

              <div className="relative px-2.5 pt-1 sm:px-2">
                {ABOUT_LEAD.map((para) => (
                  <p key={para} className="text-[16px] leading-[1.65] text-black not-first:mt-2.5">
                    {para}
                  </p>
                ))}
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.abhiyan)}
                  className="mx-auto mt-3 block text-[15px] font-medium text-[#2d689d] underline underline-offset-2"
                >
                  View More
                </button>
              </div>
            </section>

            {/* Card 2 — plays count */}
            <section className="rounded-[2rem] bg-white px-9 pt-7 pb-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-6">
                  <BrandIcon
                    src={BRAND_ICONS.playedQuizCount}
                    alt=""
                    priority
                    className="size-9 shrink-0"
                  />
                  <p className="font-[family-name:var(--font-archivo)] text-[2.35rem] leading-none tracking-tight tabular-nums text-[#2d689d]">
                    {playsCount}
                  </p>
                </div>
                <p className="pl-[3.75rem] text-[1.15rem] font-medium text-black">વખત ક્વિઝ રમાઈ</p>
                <span className="ml-[3.75rem] inline-flex w-fit items-baseline whitespace-nowrap rounded-full bg-[#e8f8ed] px-4 py-2 text-left text-[13px] font-medium text-black">
                  {new Intl.NumberFormat("en-IN").format(LANDING_WEEK_PLAYS_COUNT)} in {week}<sup>th</sup>{" week"}
                </span>
              </div>
            </section>

            {/* Card 3 — leaderboard shortcut */}
            <LeaderboardPreviewCard
              talukaLabel={talukaLabel}
              week={week}
              className="shadow-none"
              onClick={() => router.push(ROUTES.leaderboard)}
            />
          </div>
        </main>

        <LandingActionNav
          floating
          onPractice={() => router.push(ROUTES.quiz(FEATURED_QUIZ_ID, { practice: true }))}
          onPlayQuiz={() => go(ROUTES.home)}
          onG3qAi={() => router.push(ROUTES.g3qAi)}
        />
      </div>
    </AppShell>
  );
}
