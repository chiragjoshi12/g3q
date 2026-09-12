"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ParticipationCertificate } from "@/components/certificate/ParticipationCertificate";
import {
  downloadCertificatePng,
  shareCertificatePng,
} from "@/components/certificate/draw-certificate";
import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { ChevronDown, LineArrowRight, Loader2 } from "@/components/icons";
import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import {
  attemptEarnsCertificate,
  buildCertificatePayload,
  certificateFileName,
  CERT_NATIVE,
} from "@/lib/domain/certificate";
import { formatDuration, formatWeekLabel } from "@/lib/domain/format";
import { scorePraise } from "@/lib/domain/scoring";
import { useI18n } from "@/lib/i18n";
import { formatTalukaLabel } from "@/lib/format-taluka";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const ROW_GRID =
  "grid min-h-[5.75rem] w-full grid-cols-[auto_1fr_auto] items-start gap-x-3.5 px-5 py-5 text-left";
const ROW_CLASS = cn(
  ROW_GRID,
  "rounded-[1.5rem] bg-white active:bg-[#fafafa]",
);
const CERT_PREVIEW_DELAY_MS = 1000;

/** Headline score card, certificate row, and leaderboard shortcut. */
export function ScoreSummary({ attempt, quiz }) {
  const router = useRouter();
  const { language, t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const canOpenCertificate = attemptEarnsCertificate(attempt);
  const [open, setOpen] = useState(canOpenCertificate);
  const [previewReady, setPreviewReady] = useState(false);
  const [busy, setBusy] = useState(null);
  const payload = useMemo(
    () => buildCertificatePayload(user, attempt, { week: quiz?.week }),
    [user, attempt, quiz?.week]
  );
  const talukaLabel = formatTalukaLabel(user?.taluka || attempt?.taluka, language);
  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;
  const fileName = certificateFileName(payload);

  useEffect(() => {
    if (!open || !canOpenCertificate) {
      setPreviewReady(false);
      return undefined;
    }
    setPreviewReady(false);
    const timer = window.setTimeout(() => setPreviewReady(true), CERT_PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open, canOpenCertificate, attempt?.id]);

  const runCertAction = async (action, work) => {
    setBusy(action);
    try {
      await work();
    } catch {
      /* download / share already surfaces its own fallback */
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="animate-slide-up space-y-3.5">
      <div className={cn("rounded-[1.85rem] bg-white pt-7 pb-2.5")}>
        <div className="px-5">
          <div className="flex min-h-[9rem] items-center justify-between">
            <div className="shrink-0 text-left">
              <p className="w-max ml-[17px] whitespace-nowrap bg-gradient-to-r from-[#8c52ff] to-[#00bf63] bg-clip-text font-canva text-[1.15rem] font-semibold text-transparent">
                {scorePraise(attempt.percentage)}
              </p>
              {/* move this text on right side of the screen */}
              <p className="mt-2 font-canva text-[3.15rem] ml-[25px] leading-none font-bold tracking-tight text-[#111]">
                {attempt.percentage}
                <span className="text-[1.85rem]">%</span>
              </p>
            </div>
            <BrandIcon
              src={BRAND_ICONS.resultTrophy}
              alt=""
              className="h-[6.5rem] w-[8.5rem] shrink-0"
            />
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2.5 px-2.5">
          <StatChip
            tone="correct"
            value={attempt.correctCount}
            label={t("correct")}
            iconSrc={BRAND_ICONS.correct}
          />
          <StatChip
            tone="incorrect"
            value={attempt.wrongCount}
            label={t("incorrect")}
            iconSrc={BRAND_ICONS.incorrect}
          />
          <StatChip
            tone="time"
            value={formatDuration(attempt.totalTimeMs, language)}
            label={t("totalTime")}
            iconSrc={BRAND_ICONS.time}
          />
        </div>
      </div>

      <article className={cn("overflow-hidden rounded-[1.5rem] bg-white")}>
        <button
          type="button"
          onClick={() => canOpenCertificate && setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(ROW_GRID, "active:bg-[#fafafa]")}
        >
          <BrandIcon src={BRAND_ICONS.resultCertificate} alt="" className="size-10 shrink-0" />
          <span className="min-w-0 text-[1.35rem] font-bold leading-tight text-[#2d689d]">
            {t("certificate")}
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-black transition-transform duration-300 ease-emphasized",
              open && "rotate-180"
            )}
          />
          <span className="col-start-2 mt-[0.015rem] truncate text-[15px] leading-snug font-normal text-black">
            {t("viewAndDownload")}
          </span>
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-emphasized",
            open && canOpenCertificate ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="relative overflow-hidden rounded-[1rem] bg-white">
                {!previewReady ? (
                  <CertificatePreviewSkeleton />
                ) : (
                  <>
                    <ParticipationCertificate payload={payload} />
                    <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
                      <CertActionButton
                        label={t("download")}
                        disabled={Boolean(busy)}
                        onClick={() =>
                          runCertAction("download", async () => {
                            await downloadCertificatePng(payload, fileName);
                            void trackAnalyticsEvent({
                              eventType: "certificate_download",
                            });
                          })
                        }
                      >
                        {busy === "download" ? (
                          <Loader2 className="size-4 animate-spin text-white" />
                        ) : (
                          <BrandIcon
                            src={BRAND_ICONS.downloadCertificate}
                            alt=""
                            className="size-[18px] brightness-0 invert"
                          />
                        )}
                      </CertActionButton>
                      <CertActionButton
                        label={t("share")}
                        disabled={Boolean(busy)}
                        onClick={() =>
                          runCertAction("share", () =>
                            shareCertificatePng(payload, fileName, attempt.quizTitle)
                          )
                        }
                      >
                        {busy === "share" ? (
                          <Loader2 className="size-4 animate-spin text-white" />
                        ) : (
                          <BrandIcon
                            src={BRAND_ICONS.shareQuiz}
                            alt=""
                            className="size-[18px] brightness-0 invert"
                          />
                        )}
                      </CertActionButton>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      <button type="button" onClick={() => router.push(ROUTES.leaderboard)} className={ROW_CLASS}>
        <BrandGlyph
          src={BRAND_ICONS.leaderboard}
          color="#2d689d"
          className="size-10 shrink-0"
        />
        <span className="min-w-0 text-[1.35rem] font-bold leading-tight text-[#2d689d]">
          {t("leaderboard")}
        </span>
        <LineArrowRight className="size-5 shrink-0 text-black" />
        <span className="col-start-2 mt-[0.015rem] truncate text-[15px] leading-snug font-normal text-black">
          {language === "gu"
            ? `${talukaLabel} તાલુકો - ${formatWeekLabel(week, language)}`
            : language === "hi"
              ? `${talukaLabel} तालुका - ${formatWeekLabel(week, language)}`
              : `${talukaLabel} Taluka - ${formatWeekLabel(week, language)}`}
        </span>
      </button>
    </section>
  );
}

function CertificatePreviewSkeleton() {
  return (
    <div
      className="relative w-full overflow-hidden bg-[#F3F5F8]"
      style={{ aspectRatio: `${CERT_NATIVE.width} / ${CERT_NATIVE.height}` }}
      aria-busy="true"
      aria-label="Loading certificate"
    >
      <div className="absolute inset-0 flex flex-col justify-center gap-3 px-[8%] py-6">
        <span className="mx-auto h-3 w-[28%] animate-pulse rounded-md bg-[#E0E6EE]" />
        <span className="mx-auto mt-2 h-3.5 w-[55%] animate-pulse rounded-md bg-[#E0E6EE]" />
        <span className="mx-auto h-3 w-[70%] animate-pulse rounded-md bg-[#E0E6EE]" />
        <span className="mx-auto h-3 w-[64%] animate-pulse rounded-md bg-[#E0E6EE]" />
        <span className="mx-auto h-3 w-[48%] animate-pulse rounded-md bg-[#E0E6EE]" />
        <span className="mx-auto mt-4 h-8 w-[36%] animate-pulse rounded-md bg-[#E0E6EE]" />
      </div>
    </div>
  );
}

function StatChip({ tone, value, label, iconSrc }) {
  const tones = {
    correct: "bg-[#E6F4EA]",
    incorrect: "bg-[#F8E6F0]",
    time: "bg-[#FFF6D8]",
  };

  return (
    <div
      className={cn(
        "flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-[1.25rem] px-1.5 py-4",
        tones[tone]
      )}
    >
      <BrandIcon src={iconSrc} alt="" className="size-6" />
      <span className="font-inter text-center text-[0.95rem] leading-snug font-bold text-[#111]">
        {value}
      </span>
      <span className="font-inter text-center text-[11px] leading-tight font-medium text-[#6B7280]">
        {label}
      </span>
    </div>
  );
}

function CertActionButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className="grid size-10 place-items-center rounded-full bg-black/45 backdrop-blur-[2px] transition-transform active:scale-95 disabled:opacity-45"
    >
      {children}
    </button>
  );
}
