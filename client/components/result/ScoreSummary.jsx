"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CertificateViewer } from "@/components/certificate/CertificateViewer";
import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { LineArrowRight } from "@/components/icons";
import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/config/routes";
import { BRAND_ICONS } from "@/lib/brand-icons";
import {
  attemptEarnsCertificate,
  buildCertificatePayload,
} from "@/lib/domain/certificate";
import { formatDuration } from "@/lib/domain/format";
import { scorePraise } from "@/lib/domain/scoring";
import { formatTalukaLabel } from "@/lib/format-taluka";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const CARD_SHADOW = "shadow-[0_10px_28px_rgb(15_23_42/0.06)]";
const ROW_CLASS =
  "grid min-h-[5.75rem] w-full grid-cols-[auto_1fr_auto] items-start gap-x-3.5 rounded-[1.5rem] bg-white px-5 py-5 text-left shadow-[0_1px_3px_rgb(0_0_0/0.06)] active:bg-[#fafafa]";

/** Headline score card, certificate row, and leaderboard shortcut. */
export function ScoreSummary({ attempt, quiz }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const canOpenCertificate = attemptEarnsCertificate(attempt);
  const payload = useMemo(
    () => buildCertificatePayload(user, attempt, { week: quiz?.week }),
    [user, attempt, quiz?.week]
  );
  const talukaLabel = formatTalukaLabel(user?.taluka || attempt?.taluka);
  const week = Number.isFinite(appConfig.certificate.week) ? appConfig.certificate.week : 5;

  return (
    <section className="animate-slide-up space-y-3.5">
      <div className={cn("rounded-[1.85rem] bg-white px-5 pt-7 pb-7", CARD_SHADOW)}>
        <div className="flex min-h-[9rem] items-center justify-between">
          <div className="shrink-0 text-left">
            <p className="w-max whitespace-nowrap bg-gradient-to-r from-[#8c52ff] to-[#00bf63] bg-clip-text font-canva text-[1.15rem] font-semibold text-transparent">
              {scorePraise(attempt.percentage)}
            </p>
            <p className="mt-2 font-canva text-[3.15rem] leading-none font-bold tracking-tight text-[#111]">
              {attempt.percentage}
              <span className="text-[1.85rem]">%</span>
            </p>
          </div>
          <BrandIcon
            src={BRAND_ICONS.resultTrophy}
            alt=""
            className="h-[8.5rem] w-[9.5rem] shrink-0"
          />
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2.5">
          <StatChip
            tone="correct"
            value={attempt.correctCount}
            label="Correct"
            iconSrc={BRAND_ICONS.correct}
          />
          <StatChip
            tone="incorrect"
            value={attempt.wrongCount}
            label="Incorrect"
            iconSrc={BRAND_ICONS.incorrect}
          />
          <StatChip
            tone="time"
            value={formatDuration(attempt.totalTimeMs)}
            label="કુલ સમય"
            iconSrc={BRAND_ICONS.time}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => canOpenCertificate && setOpen(true)}
        className={ROW_CLASS}
      >
        <BrandIcon src={BRAND_ICONS.resultCertificate} alt="" className="size-10 shrink-0" />
        <span className="min-w-0 text-[1.35rem] font-bold leading-tight text-[#2d689d]">
          Certificate
        </span>
        <LineArrowRight className="size-5 shrink-0 text-black" />
        <span className="col-start-2 mt-[0.015rem] truncate text-[15px] leading-snug font-normal text-black">
          View and download
        </span>
      </button>

      <button type="button" onClick={() => router.push(ROUTES.leaderboard)} className={ROW_CLASS}>
        <BrandGlyph
          src={BRAND_ICONS.leaderboard}
          color="#2d689d"
          className="size-10 shrink-0"
        />
        <span className="min-w-0 text-[1.35rem] font-bold leading-tight text-[#2d689d]">
          લીડરબોર્ડ
        </span>
        <LineArrowRight className="size-5 shrink-0 text-black" />
        <span className="col-start-2 mt-[0.015rem] truncate text-[15px] leading-snug font-normal text-black">
          {talukaLabel} તાલુકો - {week} મું અઠવાડિયું
        </span>
      </button>

      <CertificateViewer open={open} payload={payload} onClose={() => setOpen(false)} />
    </section>
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
