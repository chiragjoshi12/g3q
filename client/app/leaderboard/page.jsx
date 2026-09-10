"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LeaderboardCategoryTabs,
  LeaderboardDetailRow,
} from "@/components/landing/LeaderboardList";
import {
  LeaderboardFilterBar,
  LeaderboardLocationSheet,
  LeaderboardWeekChip,
  LeaderboardWeekSheet,
} from "@/components/leaderboard/LeaderboardFilters";
import { BackButton } from "@/components/common/BackButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { PLATFORM_WEEKS } from "@/config/platformWeeks";
import { ROUTES } from "@/config/routes";
import {
  CITIZEN_LEADERBOARD,
  COLLEGE_LEADERBOARD,
  SCHOOL_LEADERBOARD,
} from "@/data/leaderboard";
import { profileController } from "@/controllers/profile.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getDataSource } from "@/lib/data/sources";
import { useI18n } from "@/lib/i18n";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { useAuthStore } from "@/store/auth.store";

const BOARDS = {
  school: SCHOOL_LEADERBOARD,
  college: COLLEGE_LEADERBOARD,
  citizen: CITIZEN_LEADERBOARD,
};
const LEADERBOARD_LIMIT = 10;

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function placeLabel(entry, language) {
  if (!entry) return "";
  if (language === "en") return entry.nameEn || entry.name || entry.nameGu || "";
  if (language === "hi") return entry.nameHi || entry.name || entry.nameEn || entry.nameGu || "";
  return entry.nameGu || entry.name || entry.nameEn || "";
}

function matchPlace(entry, name) {
  const key = normalizeKey(name);
  if (!key || !entry) return false;
  return [entry.name, entry.nameGu, entry.nameEn, entry.nameHi].some(
    (value) => normalizeKey(value) === key
  );
}

function seedIdsFromUser(user, districts) {
  if (!districts?.length) return { districtId: null, talukaId: null };

  const userTalukaId = Number(user?.talukaId);
  if (Number.isInteger(userTalukaId) && userTalukaId > 0) {
    for (const district of districts) {
      const taluka = (district.talukas || []).find((item) => Number(item.id) === userTalukaId);
      if (taluka) return { districtId: Number(district.id), talukaId: userTalukaId };
    }
  }

  let district =
    districts.find((item) => Number(item.id) === Number(user?.districtId)) ||
    districts.find((item) => matchPlace(item, user?.district)) ||
    null;

  let taluka = null;
  if (district) {
    taluka = (district.talukas || []).find((item) => matchPlace(item, user?.taluka)) || null;
  } else if (user?.taluka) {
    for (const item of districts) {
      const hit = (item.talukas || []).find((row) => matchPlace(row, user.taluka));
      if (hit) {
        district = item;
        taluka = hit;
        break;
      }
    }
  }

  return {
    districtId: district ? Number(district.id) : null,
    talukaId: taluka ? Number(taluka.id) : null,
  };
}

async function ensureUserProfile(user, isAuthenticated) {
  if (!isAuthenticated) return user;
  if (user?.taluka || user?.district || user?.talukaId) return user;
  const me = await profileController.loadMe();
  if (me) {
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, ...me } : me,
    }));
  }
  return me || user;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState("school");
  const [week, setWeek] = useState(appConfig.certificate.week || PLATFORM_WEEKS[0]?.id || 1);
  const [districtId, setDistrictId] = useState(null);
  const [talukaId, setTalukaId] = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const EMPTY_MESSAGES = {
    school: t("noPlaysYetDescription"),
    college: t("noPlaysYetDescription"),
    citizen: t("noPlaysYetDescription"),
  };

  const liveLeaderboard = hydrated && appConfig.dataSource === DATA_SOURCE.REST;

  const {
    status: geographyStatus,
    data: geographyData,
    error: geographyError,
    reload: reloadGeography,
  } = useAsyncData(
    () => getDataSource().getGeographyDistricts({ lang: language }),
    [language],
    liveLeaderboard
  );

  const districts = geographyData?.districts || [];

  useEffect(() => {
    if (!hydrated || !liveLeaderboard || locationReady) return;
    if (geographyStatus !== "ready") return;
    let cancelled = false;

    (async () => {
      const profile = await ensureUserProfile(user, isAuthenticated);
      if (cancelled) return;
      const seeded = seedIdsFromUser(profile, districts);
      setDistrictId(seeded.districtId);
      setTalukaId(seeded.talukaId);
      setLocationReady(true);
      if (!seeded.districtId || !seeded.talukaId) {
        setLocationOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    liveLeaderboard,
    locationReady,
    geographyStatus,
    districts,
    isAuthenticated,
    user,
  ]);

  const {
    status,
    data,
    error,
    reload,
  } = useAsyncData(
    async () => {
      if (!liveLeaderboard || !locationReady || !talukaId) return null;
      return getDataSource().getLeaderboardOverview({
        limit: LEADERBOARD_LIMIT,
        week,
        talukaId,
        lang: language,
      });
    },
    [liveLeaderboard, locationReady, week, talukaId, language],
    liveLeaderboard && locationReady && Boolean(talukaId)
  );

  const selectedDistrict = useMemo(
    () => districts.find((item) => Number(item.id) === Number(districtId)) || null,
    [districts, districtId]
  );
  const selectedTaluka = useMemo(
    () =>
      (selectedDistrict?.talukas || []).find((item) => Number(item.id) === Number(talukaId)) ||
      null,
    [selectedDistrict, talukaId]
  );

  const activeBoard = liveLeaderboard ? data?.[tab] ?? null : null;
  const weekOptions = data?.weeks?.length ? data.weeks : PLATFORM_WEEKS;
  const youName = hydrated ? user?.name : null;
  const rows = liveLeaderboard
    ? status === "ready"
      ? activeBoard?.items ?? []
      : []
    : (BOARDS[tab] ?? SCHOOL_LEADERBOARD).slice(0, LEADERBOARD_LIMIT);
  const showEmptyState =
    liveLeaderboard && locationReady && Boolean(talukaId) && status === "ready" && rows.length === 0;
  const showLoading =
    (liveLeaderboard && geographyStatus === "loading") ||
    !locationReady ||
    (liveLeaderboard && Boolean(talukaId) && status === "loading");
  const needsLocation = locationReady && (!districtId || !talukaId);

  return (
    <DesktopAppShell
      showSidebar={false}
      className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F5F6F8]"
    >
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F5F6F8] md:max-w-none lg:max-w-none lg:bg-transparent">
        <header className="relative z-20 flex shrink-0 items-center gap-3 bg-white px-4 py-3.5 lg:bg-transparent lg:px-10 lg:pt-8 lg:pb-2">
          <BackButton
            className="shrink-0"
            label={t("close")}
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
              router.push(hydrated && isAuthenticated ? ROUTES.home : ROUTES.welcome);
            }}
          />
          <h1 className="min-w-0 flex-1 truncate text-[1.35rem] font-bold tracking-tight text-[#111] lg:text-[2rem]">
            {t("leaderboard")}
          </h1>
          <LeaderboardWeekChip week={week} onClick={() => setWeekOpen(true)} />
        </header>

        <main className="no-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pb-8 pt-4 lg:mx-auto lg:w-full lg:max-w-[56rem] lg:px-10 lg:pt-4 lg:pb-16 xl:max-w-[64rem] xl:px-14">
            <LeaderboardFilterBar
              districtLabel={placeLabel(selectedDistrict, language)}
              talukaLabel={placeLabel(selectedTaluka, language)}
              onOpenLocation={() => setLocationOpen(true)}
            />

            <div className="mt-6">
              <LeaderboardCategoryTabs value={tab} onChange={setTab} />
            </div>

            <div className="mt-4 overflow-hidden rounded-t-[1.75rem] px-3 pt-1 lg:rounded-[1.75rem] lg:px-4 lg:py-2 lg:shadow-[0_12px_40px_rgb(15_23_42/0.06)]">
              {liveLeaderboard && geographyStatus === "error" ? (
                <ErrorState message={geographyError} onRetry={reloadGeography} className="py-10" />
              ) : null}
              {needsLocation ? (
                <EmptyState
                  title={t("selectDistrictTitle")}
                  description={t("leaderboardLocationHint")}
                  className="py-10"
                />
              ) : null}
              {!needsLocation && showLoading ? <LoadingState className="py-10" /> : null}
              {!needsLocation && liveLeaderboard && status === "error" ? (
                <ErrorState message={error} onRetry={reload} className="py-10" />
              ) : null}
              {!needsLocation && showEmptyState ? (
                <EmptyState
                  title={t("noPlaysYetTitle")}
                  description={EMPTY_MESSAGES[tab]}
                  className="py-10"
                />
              ) : null}

              {!needsLocation && !showLoading && rows.length > 0 ? (
                <ul aria-live="polite">
                  {rows.map((row) => (
                    <LeaderboardDetailRow
                      key={`${tab}-${row.rank}-${row.userId || row.name}`}
                      rank={row.rank}
                      name={row.name}
                      avatar={row.avatar}
                      institute={
                        tab === "citizen"
                          ? row.taluka || row.district || row.institute
                          : row.institute
                      }
                      grade={row.grade}
                      score={row.bestPercentage ?? row.score}
                      you={Boolean(row.you || (youName && youName === row.name))}
                    />
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <LeaderboardLocationSheet
        open={locationOpen}
        districts={districts}
        districtId={districtId}
        talukaId={talukaId}
        onDistrictChange={(next) => {
          setDistrictId(next);
          setTalukaId(null);
        }}
        onTalukaChange={(next) => {
          setTalukaId(next);
          if (districtId && next) setLocationOpen(false);
        }}
        onClose={() => setLocationOpen(false)}
      />
      <LeaderboardWeekSheet
        open={weekOpen}
        week={week}
        weeks={weekOptions}
        onSelect={(next) => {
          setWeek(next);
          setWeekOpen(false);
        }}
        onClose={() => setWeekOpen(false)}
      />
    </DesktopAppShell>
  );
}
