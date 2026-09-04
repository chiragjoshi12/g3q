"use client";

import { Clock, Pause, X } from "@/components/icons";

import { BrandIcon } from "@/components/common/BrandIcon";
import { formatClock } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Apple-style liquid-glass quiz top bar — close, question progress, timer.
 */
export function QuizHeader({ index, total, elapsedMs, paused, onExit }) {
  return (
    <header className="relative z-30 shrink-0 px-3.5 pt-[max(0.55rem,env(safe-area-inset-top))] pb-1.5 sm:px-5">
      <div
        className={cn(
          "relative mx-auto flex w-fit items-center gap-[3.5rem] overflow-hidden rounded-full px-2.5 py-2.5",
          "border border-white/50 bg-white/25",
          "shadow-[0_8px_28px_rgb(15_23_42/0.10),inset_0_1px_1px_rgb(255_255_255/0.75),inset_0_-1px_0_rgb(255_255_255/0.18)]",
          "backdrop-blur-[40px] backdrop-saturate-[1.8]",
          "supports-[backdrop-filter]:bg-white/[0.14]"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/55 to-transparent"
        />

        <button
          type="button"
          onClick={onExit}
          aria-label="ક્વિઝ છોડો"
          className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgb(15_23_42/0.08)] transition-transform active:scale-95"
        >
          <X className="size-[18px] text-[#111]" strokeWidth={2.1} />
        </button>

        <div className="relative flex flex-col items-center justify-center gap-0.5">
          <BrandIcon src={BRAND_ICONS.questionsCount} alt="" className="size-5" />
          <span className="font-canva text-[0.95rem] leading-none font-bold tracking-tight text-[#111]">
            પ્રશ્ન {index + 1}/{total || "–"}
          </span>
        </div>

        <div
          className="relative flex flex-col items-center justify-center gap-0.5"
          title={paused ? "જવાબ સબમિટ થયો — સમય થંભેલો છે" : "સમય ચાલુ છે"}
        >
          {paused ? (
            <Pause className="size-5 text-[#C2410C]" strokeWidth={2.1} />
          ) : (
            <Clock className="size-5 text-[#1F2937]" strokeWidth={1.85} />
          )}
          <span
            className={cn(
              "font-canva text-[0.95rem] leading-none font-normal tabular-nums",
              paused ? "animate-pulse text-[#C2410C]" : "text-[#111]"
            )}
          >
            {formatClock(elapsedMs)}
          </span>
        </div>
      </div>
    </header>
  );
}
