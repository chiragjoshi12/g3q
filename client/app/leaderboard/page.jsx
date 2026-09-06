"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LeaderboardCategoryTabs,
  LeaderboardDetailRow,
} from "@/components/landing/LeaderboardList";
import { BrandIcon } from "@/components/common/BrandIcon";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { LandingActionNav } from "@/components/landing/LandingActionNav";
import { AppShell } from "@/components/layout/AppShell";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { FEATURED_QUIZ_ID, ROUTES, setPostAuthPath } from "@/config/routes";
import {
  CITIZEN_LEADERBOARD,
  COLLEGE_LEADERBOARD,
  SCHOOL_LEADERBOARD,
} from "@/data/leaderboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { getDataSource } from "@/lib/data/sources";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { useAuthStore } from "@/store/auth.store";

const BOARDS = {
  school: SCHOOL_LEADERBOARD,
  college: COLLEGE_LEADERBOARD,
  citizen: CITIZEN_LEADERBOARD,
};

function scopeLabel(tab, apiLabel, talukaLabel, week) {
  if (apiLabel) return apiLabel;
  if (tab === "school") return `${talukaLabel} તાલુકો - ${week} મું અઠવાડિયું`;
  if (tab === "college") return `કોલેજ કેટેગરી - રાજ્ય સ્તર`;
  return `નાગરિક કેટેગરી - રાજ્ય સ્તર`;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState("school");
  const liveLeaderboard = hydrated && isAuthenticated && appConfig.dataSource === DATA_SOURCE.REST;

  const {
    status,
    data,
    error,
    reload,
  } = useAsyncData(
    async () => {
      if (!liveLeaderboard) return null;
      if (tab === "college") {
        return getDataSource().getCollegeLeaderboard({ limit: 50 });
      }
      if (tab === "citizen") {
        return getDataSource().getCitizenLeaderboard({ limit: 50 });
      }
      return getDataSource().getSchoolLeaderboard({ limit: 50 });
    },
    [tab, liveLeaderboard],
    liveLeaderboard
  );
  const talukaLabel = user?.taluka || "તમારો";
  const week = Number(data?.week) || appConfig.certificate.week || 5;
  const youName = hydrated ? user?.name : null;
  const rows = liveLeaderboard
    ? status === "ready"
      ? data?.items ?? []
      : []
    : BOARDS[tab] ?? SCHOOL_LEADERBOARD;

  const go = (path) => {
    if (hydrated && isAuthenticated) {
      router.push(path);
      return;
    }
    setPostAuthPath(path);
    router.push(ROUTES.auth);
  };

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F5F6F8]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F5F6F8] md:max-w-none">
        <header className="relative z-20 flex shrink-0 items-center justify-center bg-white px-4 py-3.5">
          <button
            type="button"
            onClick={() => {
              const historyIndex =
                typeof window !== "undefined" ? window.history.state?.idx : undefined;
              if (typeof historyIndex === "number" && historyIndex > 0) {
                router.back();
                return;
              }
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
                return;
              }
              router.push(hydrated && isAuthenticated ? ROUTES.home : ROUTES.root);
            }}
            aria-label="પાછળ જાઓ"
            className="absolute left-4 grid size-10 place-items-center rounded-full bg-white transition-transform active:scale-95"
          >
            <BrandIcon src={BRAND_ICONS.back} alt="" className="size-3.5" />
          </button>
          <h1 className="translate-y-1 text-[1.35rem] font-bold tracking-tight text-[#2d689d]">લીડરબોર્ડ</h1>
        </header>

        <main className="no-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pb-28 pt-5">
            <div className="flex justify-center">
              <span className="inline-flex max-w-full items-center rounded-full bg-[#2d689d] px-5 py-2.5 text-center font-canva text-[16px] font-[800] leading-snug text-white">
                {scopeLabel(tab, data?.label, talukaLabel, week)}
              </span>
            </div>

            <div className="mt-7">
              <LeaderboardCategoryTabs value={tab} onChange={setTab} />
            </div>

            {liveLeaderboard && status === "loading" ? <LoadingState className="py-10" /> : null}
            {liveLeaderboard && status === "error" ? (
              <ErrorState message={error} onRetry={reload} className="py-10" />
            ) : null}

            <ul className="mt-3" aria-live="polite">
              {rows.map((row) => (
                <LeaderboardDetailRow
                  key={`${tab}-${row.rank}`}
                  rank={row.rank}
                  name={row.name}
                  institute={row.institute}
                  grade={row.grade}
                  score={row.bestPercentage ?? row.score}
                  you={Boolean(row.you || (youName && youName === row.name))}
                />
              ))}
            </ul>
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
