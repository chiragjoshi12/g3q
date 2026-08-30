"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import {
  BoardToggle,
  LeaderboardGap,
  LeaderboardRow,
} from "@/components/landing/LeaderboardList";
import { AppShell } from "@/components/layout/AppShell";
import { appConfig } from "@/config/app.config";
import { FEATURED_QUIZ_ID, ROUTES, setPostAuthPath } from "@/config/routes";
import {
  COLLEGE_LEADERBOARD,
  LANDING_PLAYS_COUNT,
  SCHOOL_LEADERBOARD,
} from "@/data/leaderboard";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { ROLE } from "@/lib/domain/roles";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useAuthStore } from "@/store/auth.store";

const ABOUT = {
  lead: "ગુજરાત જ્ઞાન ગુરુ ક્વિઝ (G3Q 2.0) એ શિક્ષણ, જ્ઞાન અને સ્પર્ધાને જોડતી અનોખી પ્રવૃત્તિ છે. રાજ્યના તમામ વિદ્યાર્થીઓ સ્થાન, બોર્ડ, માધ્યમ કે લિંગ ભેદ વગર આ ક્વિઝમાં ભાગ લઈ શકે છે.",
  more: " આ ક્વિઝનો ઉદ્દેશ વિદ્યાર્થીઓમાં ઉત્સાહ વધારવાનો, ભાગીદારી વધારવાનો અને જ્ઞાન તથા જાગૃતિને પ્રોત્સાહન આપવાનો છે.",
};

function resolveYou(board, user) {
  if (user) {
    const match = board.find((row) => row.name === user.name);
    return {
      rank: match?.rank ?? 2,
      name: user.name,
      institute: user.institute,
      grade: user.grade,
    };
  }
  return board[1] ?? board[0];
}

/**
 * Launch screen. First paint matches the hero mockup. Scroll reveals the
 * leaderboard behind the pinned Play/Practice buttons.
 */
export default function LandingPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [expanded, setExpanded] = useState(false);
  const [board, setBoard] = useState(() =>
    user?.role === ROLE.COLLEGE ? "college" : "school"
  );

  const rows = board === "college" ? COLLEGE_LEADERBOARD : SCHOOL_LEADERBOARD;
  const you = useMemo(() => resolveYou(rows, hydrated ? user : null), [rows, hydrated, user]);

  const go = (path) => {
    if (hydrated && isAuthenticated) {
      router.push(path);
      return;
    }
    setPostAuthPath(path);
    router.push(ROUTES.auth);
  };

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F3F3F3]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F3F3F3] md:max-w-none">
        <header className="relative z-20 shrink-0 bg-white px-4 py-3 shadow-[0_1px_0_rgb(15_23_42/0.08)]">
          <div className="flex items-center gap-2">
            <BrandIcon
              src={BRAND_ICONS.logo}
              alt="G3Q 2.0"
              priority
              className="size-12 shrink-0"
            />
            <h1 className="font-heading min-w-0 flex-1 text-center text-[1.7rem] leading-none font-bold tracking-tight text-primary-600">
              {appConfig.name}
            </h1>
            <span className="size-12 shrink-0" aria-hidden />
          </div>
        </header>

        <main className="no-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-4 pb-36">
            <div className="overflow-hidden rounded-[1.35rem]">
              <Image
                src="/landing/hero.png"
                alt="Ready for a Quiz?"
                width={1536}
                height={1024}
                priority
                className="h-auto w-full object-cover"
              />
            </div>

            <p className="mt-5 text-[15px] leading-[1.65] text-[#4B5563]">
              {ABOUT.lead}
              {expanded ? ABOUT.more : null}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mx-auto mt-3 block text-[15px] font-medium text-[#2563EB] underline underline-offset-2"
            >
              {expanded ? "View Less" : "View More"}
            </button>

            <div className="mt-5 rounded-[1.75rem] bg-gradient-to-b from-[#fffcf5] to-[#d8d5ca] px-5 py-8 text-center">
              <p className="inline-block bg-gradient-to-b from-[#731919] to-[#e52b2b] bg-clip-text font-[family-name:var(--font-archivo)] text-[2.65rem] leading-none text-transparent">
                {new Intl.NumberFormat("en-IN").format(LANDING_PLAYS_COUNT)}
              </p>
              <p className="mt-3 text-lg font-bold text-[#1F3A5F]">
                વખત ક્વિઝ રમાઈ
              </p>
            </div>

            <section className="mt-5 rounded-t-[1.85rem] bg-white px-5 pt-6 pb-4">
              <h2 className="text-center text-[1.45rem] font-bold text-[#111]">
                ક્વિઝ લીડરબોર્ડ
              </h2>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-[#6B7280]">
                અહીં તમારા તાલુકાના ટોપ 10 વિદ્યાર્થીઓનો લાઈવ રેન્ક બતાવેલ છે.
              </p>

              <div className="mt-5">
                <BoardToggle value={board} onChange={setBoard} />
              </div>

              <div className="mt-6 flex text-[14px] text-black">
                <span className="w-7 shrink-0 text-center">રેન્ક</span>
                <span className="ml-14">વિદ્યાર્થી</span>
              </div>

              <ul>
                {rows.map((row) => (
                  <LeaderboardRow key={`${board}-${row.rank}`} {...row} />
                ))}
                <LeaderboardGap />
                <LeaderboardRow {...you} you />
              </ul>
            </section>
          </div>
        </main>

        <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <div className="h-6 bg-gradient-to-b from-transparent to-[#F3F3F3]/80" />
          <div className="pointer-events-auto mx-auto flex w-[82%] flex-col gap-3 px-0 pt-1 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
            <AppButton
              block
              onClick={() => go(ROUTES.home)}
              className="h-16 bg-[#2d689d] hover:bg-[#255a88]"
            >
              Play Quiz
            </AppButton>
            <AppButton
              block
              variant="tonal"
              onClick={() => go(ROUTES.quiz(FEATURED_QUIZ_ID))}
              className="h-16 bg-[#f5f5f5] text-[#2d689d] hover:bg-[#ececec]"
            >
              Practice Quiz
            </AppButton>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
