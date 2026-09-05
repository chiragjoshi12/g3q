"use client";

import { Pause, X } from "@/components/icons";

import { BrandIcon } from "@/components/common/BrandIcon";
import { formatClock } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Apple-style liquid-glass quiz top bar — close, question progress, timer.
 * Questions + Time share the same icon → label sequence.
 */
export function QuizHeader({ index, total, elapsedMs, paused, onExit }) {
  return (
    <header className="relative z-30 shrink-0 px-3.5 pt-[max(0.55rem,env(safe-area-inset-top))] pb-1.5 sm:px-5">
      <div
        className={cn(
          "relative mx-auto flex w-fit items-center gap-[3.5rem] overflow-hidden rounded-full px-4.5 py-2.5",
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
          // move close button to left side
          className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white transition-transform active:scale-95 ml-[-5px]"
        >
          <X className="size-[18px] text-[#111]" strokeWidth={2.1} />
        </button>

        <StatBlock
          icon={<BrandIcon src={BRAND_ICONS.questionsCount} alt="" className="size-5" />}
          label={`પ્રશ્ન ${index + 1}/${total || "–"}`}
        />

        <StatBlock
          title={paused ? "જવાબ સબમિટ થયો — સમય થંભેલો છે" : "સમય ચાલુ છે"}
          className="-translate-x-2.5"
          icon={
            paused ? (
              <Pause className="size-5 text-[#C2410C]" strokeWidth={2.1} />
            ) : (
              <BrandIcon src={BRAND_ICONS.time} alt="" className="size-4" />
            )
          }
          label={formatClock(elapsedMs)}
          labelClassName={cn(
            "tabular-nums font-normal",
            paused ? "animate-pulse text-[#C2410C]" : "text-[#111]"
          )}
        />
      </div>
    </header>
  );
}

function StatBlock({ icon, label, title, className, labelClassName }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-1.5",
        className
      )}
      title={title}
    >
      <div className="grid size-5 place-items-center">{icon}</div>
      <span
        className={cn(
          "font-canva mt-0.5 text-[0.95rem] leading-none font-bold tracking-tight text-[#111]",
          labelClassName
        )}
      >
        {label}
      </span>
    </div>
  );
}
