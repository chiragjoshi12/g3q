"use client";

import { useMemo, useState } from "react";

import { CertificateViewer } from "@/components/certificate/CertificateViewer";
import { BrandIcon } from "@/components/common/BrandIcon";
import {
  attemptEarnsCertificate,
  buildCertificatePayload,
} from "@/lib/domain/certificate";
import { formatDuration } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const CARD_SHADOW = "shadow-[0_10px_28px_rgb(15_23_42/0.06)]";

/** Headline score card: percentage, trophy, stat chips, and certificate row. */
export function ScoreSummary({ attempt, quiz }) {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const earnedCertificate = attemptEarnsCertificate(attempt);
  const payload = useMemo(
    () => buildCertificatePayload(user, attempt, { week: quiz?.week }),
    [user, attempt, quiz?.week]
  );

  return (
    <section className="animate-slide-up space-y-4">
      <div className={cn("rounded-[1.75rem] bg-white px-5 pt-6 pb-5", CARD_SHADOW)}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-canva text-[3rem] leading-none font-bold tracking-tight text-[#111]">
            {attempt.percentage}
            <span className="text-[1.85rem]">%</span>
          </p>
          <BrandIcon
            src={BRAND_ICONS.resultTrophy}
            alt=""
            className="h-[7rem] w-[8rem] shrink-0"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
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

      {earnedCertificate ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex w-full items-center gap-3 rounded-[1.35rem] bg-white px-5 py-4 text-left transition-transform active:scale-[0.99]",
            CARD_SHADOW
          )}
        >
          <BrandIcon src={BRAND_ICONS.resultCertificate} alt="" className="size-9 shrink-0" />
          <span className="font-canva text-[1.05rem] font-bold text-[#2C6698]">Certificate</span>
        </button>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 rounded-[1.35rem] bg-white px-5 py-4 opacity-55",
            CARD_SHADOW
          )}
        >
          <BrandIcon src={BRAND_ICONS.resultCertificate} alt="" className="size-9 shrink-0" />
          <span className="font-canva text-[1.05rem] font-bold text-[#2C6698]">Certificate</span>
        </div>
      )}

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
        "flex min-h-[7.25rem] flex-col items-center justify-center gap-1.5 rounded-[1.25rem] px-1.5 py-3.5",
        tones[tone]
      )}
    >
      <BrandIcon src={iconSrc} alt="" className="size-8" />
      <span className="font-inter text-center text-[0.95rem] leading-snug font-bold text-[#111]">
        {value}
      </span>
      <span className="font-inter text-center text-[11px] leading-tight font-medium text-[#6B7280]">
        {label}
      </span>
    </div>
  );
}
