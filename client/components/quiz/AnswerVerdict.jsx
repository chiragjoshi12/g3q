"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import { formatDuration } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Result stamp shown on the question after the explanation sheet closes.
 * Correct gets a burst + pop; wrong gets a shake and a hard red mark.
 */
export function AnswerVerdict({ correct, timeSpentMs }) {
  return (
    <div
      className={cn(
        "relative overflow-visible rounded-[1.75rem] px-4 py-5",
        correct
          ? "bg-gradient-to-br from-[#DCFCE7] via-[#ECFDF3] to-[#F0FDF4]"
          : "animate-verdict-shake bg-gradient-to-br from-[#FEE2E2] via-[#FEF2F2] to-[#FFF1F2]"
      )}
    >
      {correct ? null : <WrongRipple />}

      <div className="relative flex items-center gap-4">
        <div className="relative grid size-[4.25rem] shrink-0 place-items-center overflow-visible">
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full animate-pulse-ring",
              correct ? "bg-success/40" : "bg-error/40"
            )}
          />
          {correct ? <ConfettiBurst /> : null}
          <BrandIcon
            src={correct ? BRAND_ICONS.correct : BRAND_ICONS.incorrect}
            alt={correct ? "સાચો જવાબ" : "ખોટો જવાબ"}
            className="relative size-14 animate-verdict-pop"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading text-[1.65rem] leading-none font-bold tracking-tight",
              correct ? "text-[#15803D]" : "text-[#B91C1C]"
            )}
          >
            {correct ? "સાચો જવાબ!" : "ખોટો જવાબ"}
          </p>
          <p
            className={cn(
              "mt-1.5 text-sm font-medium",
              correct ? "text-[#166534]" : "text-[#991B1B]"
            )}
          >
            {correct ? "શાબાશ — આગળ વધો." : "કોઈ વાંધો નહીં, આગળ શીખો."}
          </p>
        </div>

        <span
          className={cn(
            "hidden shrink-0 rounded-full px-3 py-1.5 text-sm font-bold sm:inline-flex",
            correct ? "bg-white/80 text-[#15803D]" : "bg-white/80 text-[#B91C1C]"
          )}
        >
          {formatDuration(timeSpentMs)}
        </span>
      </div>
    </div>
  );
}

function WrongRipple() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-error/15"
    />
  );
}
