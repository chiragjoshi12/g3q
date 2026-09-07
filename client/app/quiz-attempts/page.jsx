"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CertificateViewer } from "@/components/certificate/CertificateViewer";
import { EmptyState, LoadingState } from "@/components/common/StateViews";
import { BrandIcon } from "@/components/common/BrandIcon";
import { AppShell } from "@/components/layout/AppShell";
import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { profileController } from "@/controllers/profile.controller";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { buildCertificatePayload } from "@/lib/domain/certificate";
import { formatGujaratiDate, formatWeekLabel } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const DEFAULT_WEEK = Number.isFinite(appConfig.certificate.week)
  ? appConfig.certificate.week
  : 1;

export default function QuizAttemptsPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { ready } = useAuthGuard();
  const user = useAuthStore((state) => state.user);
  const [certAttempt, setCertAttempt] = useState(null);

  const { status, data } = useAsyncData(
    () => profileController.loadAttempts(user?.id),
    [user?.id],
    ready
  );

  const attempts = data ?? [];
  const payload = useMemo(
    () => (certAttempt ? buildCertificatePayload(user, certAttempt) : null),
    [user, certAttempt]
  );

  return (
    <AppShell className="bg-[#F2F2F2]">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F2F2F2]">
        <header className="relative z-10 flex shrink-0 items-center justify-center px-4 pt-7 pb-7">
          <button
            type="button"
            onClick={() => router.push(ROUTES.profile)}
            aria-label={t("close")}
            className="absolute left-4 grid size-10 place-items-center rounded-full bg-white transition-transform active:scale-95"
          >
            <BrandIcon src={BRAND_ICONS.back} alt="" className="size-3.5" />
          </button>
          <h1 className="font-heading text-[1.25rem] font-bold text-[#111]">{t("quizAttempts")}</h1>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-[26.5rem] space-y-3.5 pt-1 md:max-w-[32rem]">
            {!ready || status === "loading" ? (
              <LoadingState label={t("statsLoading")} className="py-16" />
            ) : null}

            {status === "ready" && attempts.length === 0 ? (
              <EmptyState
                title={t("noAttemptsTitle")}
                description={t("noAttemptsDescription")}
              />
            ) : null}

            {status === "ready"
              ? attempts.map((attempt) => (
                  <QuizAttemptCard
                    key={attempt.attemptId}
                    attempt={attempt}
                    language={language}
                    onRank={() => router.push(ROUTES.leaderboard)}
                    onCertificate={() => setCertAttempt(attempt)}
                  />
                ))
              : null}
          </div>
        </div>
      </main>

      <CertificateViewer
        open={Boolean(payload)}
        payload={payload}
        onClose={() => setCertAttempt(null)}
      />
    </AppShell>
  );
}

function QuizAttemptCard({ attempt, language, onRank, onCertificate }) {
  const { t } = useI18n();
  const week = Number(attempt?.week);
  const weekLabel = formatWeekLabel(Number.isFinite(week) && week > 0 ? week : DEFAULT_WEEK, language);

  return (
    <article className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_1px_3px_rgb(15_23_42/0.06)]">
      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* move text on right side of the screen */}
          <span className="rounded-md bg-[#e8f8ed] px-3 py-2 ml-[3px] font-heading text-[14px] leading-none text-[#000000]">
            {weekLabel}
          </span>
          <span className="shrink-0 font-heading text-[14px] text-[#111]">
            {t("scoreLabel")}: {attempt.correctCount}/{attempt.totalQuestions}
          </span>
        </div>
        <h2 className="mt-5 font-heading text-[16px] ml-[3px] leading-snug font-bold text-[#111]">
          {attempt.quizTitle}
        </h2>
        <p className="mt-[5px] ml-[3px] font-heading text-[14px] text-[#111]">
          {formatGujaratiDate(attempt.completedAt, language)}
        </p>
      </div>
      <div className="grid grid-cols-2 border-t border-[#E8E8E8]">
        <button
          type="button"
          onClick={onRank}
          className="border-r border-[#E8E8E8] py-3.5 text-center font-heading text-[16px] text-[#111] transition-colors active:bg-[#f5f5f5]"
        >
          {t("viewRank")}
        </button>
        <button
          type="button"
          onClick={onCertificate}
          className={cn(
            "py-3.5 text-center font-heading text-[15px] text-[#111]",
            "transition-colors active:bg-black/[0.03]"
          )}
        >
          {t("certificate")}
        </button>
      </div>
    </article>
  );
}
