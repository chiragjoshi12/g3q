"use client";

import { useRouter } from "next/navigation";

import { BrandIcon } from "@/components/common/BrandIcon";
import { ErrorState } from "@/components/common/StateViews";
import { BannerSlider } from "@/components/landing/BannerSlider";
import { LandingActionNav } from "@/components/landing/LandingActionNav";
import { LeaderboardPreviewCard } from "@/components/landing/LeaderboardList";
import { AppShell } from "@/components/layout/AppShell";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { FEATURED_QUIZ_ID, ROUTES, setPostAuthPath } from "@/config/routes";
import { LANGUAGE } from "@/config/languages";
import { LANDING_PLAYS_COUNT, LANDING_WEEK_PLAYS_COUNT } from "@/data/leaderboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useCountUp } from "@/hooks/useCountUp";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { getDataSource } from "@/lib/data/sources";
import { useI18n } from "@/lib/i18n";
import { formatTalukaLabel } from "@/lib/format-taluka";
import { useAuthStore } from "@/store/auth.store";

const LANDING_BANNERS = ["/q3quiz.png", "/white-banner.jpeg"];

const ABOUT_LEAD = {
  [LANGUAGE.GUJARATI]: [
    "ગુજરાત જ્ઞાન ગુરુ ક્વિઝ (G3Q 3.0) એ શિક્ષણ, જ્ઞાન અને સ્પર્ધાને જોડતી અનોખી પ્રવૃત્તિ છે. રાજ્યના તમામ વિદ્યાર્થીઓ સ્થાન, બોર્ડ, માધ્યમ કે લિંગ ભેદ વગર આ ક્વિઝમાં ભાગ લઈ શકે છે.",
    "આ ક્વિઝ દ્વારા વિદ્યાર્થીઓ અને નાગરિકોમાં સામાન્ય જ્ઞાન, સ્પર્ધાત્મક તૈયારી અને શૈક્ષણિક ઉત્સાહ વધારવાનો પ્રયાસ કરવામાં આવે છે.",
  ],
  [LANGUAGE.ENGLISH]: [
    "Gujarat Gyan Guru Quiz (G3Q 3.0) is a unique initiative that brings together education, knowledge, and healthy competition.",
    "Students and citizens across the state can take part in the quiz, strengthen general knowledge, and prepare with confidence.",
  ],
  [LANGUAGE.HINDI]: [
    "गुजरात ज्ञान गुरु क्विज (G3Q 3.0) शिक्षा, ज्ञान और स्वस्थ प्रतिस्पर्धा को साथ लाने वाला एक विशेष अभियान है।",
    "राज्य भर के विद्यार्थी और नागरिक इस क्विज में भाग लेकर अपना सामान्य ज्ञान मजबूत कर सकते हैं और आत्मविश्वास के साथ तैयारी कर सकते हैं।",
  ],
};

export default function WelcomePage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const liveLanding = appConfig.dataSource === DATA_SOURCE.REST;
  const {
    status: landingStatus,
    data: landingData,
    error: landingError,
    reload: reloadLanding,
  } = useAsyncData(() => getDataSource().getLandingSummary(), [], liveLanding);

  const talukaLabel = formatTalukaLabel(hydrated ? user?.taluka : null, language);
  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;
  const totalPlays = liveLanding ? Number(landingData?.totalPlays ?? 0) : Number(LANDING_PLAYS_COUNT);
  const weeklyPlays = liveLanding
    ? Number(landingData?.weeklyPlays ?? 0)
    : Number(LANDING_WEEK_PLAYS_COUNT);
  const practiceQuizId = landingData?.featuredQuizId || FEATURED_QUIZ_ID;
  const playsCount = useCountUp(totalPlays, { durationMs: 1600 });

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
                {(ABOUT_LEAD[language] || ABOUT_LEAD.gu).map((para) => (
                  <p key={para} className="text-[16px] leading-[1.65] text-black not-first:mt-2.5">
                    {para}
                  </p>
                ))}
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.abhiyan)}
                  className="mx-auto mt-3 block text-[15px] font-medium text-[#2d689d] underline underline-offset-2"
                >
                  {t("viewMore")}
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white px-9 pt-7 pb-5">
              {landingStatus === "error" ? (
                <ErrorState message={landingError} onRetry={reloadLanding} className="py-6" />
              ) : null}
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
                <p className="pl-[3.75rem] text-[1.15rem] font-medium text-black">{t("timesQuizPlayed")}</p>
                <span className="ml-[3.75rem] inline-flex w-fit items-baseline whitespace-nowrap rounded-full bg-[#e8f8ed] px-4 py-2 text-left text-[13px] font-medium text-black">
                  {new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN").format(weeklyPlays)}{" "}
                  {language === "gu"
                    ? `માં ${week}મું અઠવાડિયું`
                    : language === "hi"
                      ? `में सप्ताह ${week}`
                      : `in week ${week}`}
                </span>
              </div>
            </section>

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
          onPractice={() => router.push(ROUTES.quiz(practiceQuizId, { practice: true }))}
          onPlayQuiz={() => go(ROUTES.home)}
          onG3qAi={() => router.push(ROUTES.g3qAi)}
        />
      </div>
    </AppShell>
  );
}
