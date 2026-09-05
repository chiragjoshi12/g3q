"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LeaderboardCategoryTabs,
  LeaderboardDetailRow,
} from "@/components/landing/LeaderboardList";
import { BrandIcon } from "@/components/common/BrandIcon";
import { LandingActionNav } from "@/components/landing/LandingActionNav";
import { AppShell } from "@/components/layout/AppShell";
import { appConfig } from "@/config/app.config";
import { FEATURED_QUIZ_ID, ROUTES, setPostAuthPath } from "@/config/routes";
import {
  CITIZEN_LEADERBOARD,
  COLLEGE_LEADERBOARD,
  SCHOOL_LEADERBOARD,
} from "@/data/leaderboard";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { formatTalukaLabel } from "@/lib/format-taluka";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { useAuthStore } from "@/store/auth.store";

const BOARDS = {
  school: SCHOOL_LEADERBOARD,
  college: COLLEGE_LEADERBOARD,
  citizen: CITIZEN_LEADERBOARD,
};

export default function LeaderboardPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState("school");

  const talukaLabel = formatTalukaLabel(hydrated ? user?.taluka : null);
  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;
  const rows = BOARDS[tab] ?? SCHOOL_LEADERBOARD;
  const youName = hydrated ? user?.name : null;

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
                {talukaLabel} તાલુકો - {week} મું અઠવાડિયું
              </span>
            </div>

            <div className="mt-7">
              <LeaderboardCategoryTabs value={tab} onChange={setTab} />
            </div>

            <ul className="mt-3" aria-live="polite">
              {rows.map((row) => (
                <LeaderboardDetailRow
                  key={`${tab}-${row.rank}`}
                  {...row}
                  you={Boolean(youName && youName === row.name)}
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
