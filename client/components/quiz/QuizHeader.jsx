"use client";

import { Clock, X } from "@/components/icons";

import { formatClock } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

const CHIP =
  "h-11 rounded-full bg-white shadow-[0_1px_4px_rgb(15_23_42/0.08)]";

/** Close, question count and timer — white chips on light grey, matching the play mock. */
export function QuizHeader({ index, total, elapsedMs, paused, onExit }) {
  return (
    <header className="relative z-20 shrink-0 bg-[#F2F2F2] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-5">
      <div className="mx-auto grid w-full max-w-[26.5rem] grid-cols-[1fr_auto_1fr] items-center md:max-w-none">
        <button
          type="button"
          onClick={onExit}
          aria-label="ક્વિઝ છોડો"
          className={cn(
            CHIP,
            "grid size-11 shrink-0 place-items-center justify-self-start transition-transform active:scale-95"
          )}
        >
          <X className="size-[1.15rem] text-[#111]" strokeWidth={1.8} />
        </button>

        <span
          className={cn(
            CHIP,
            "flex items-center px-5 font-canva text-[0.95rem] font-bold whitespace-nowrap text-[#2C6698]"
          )}
        >
          પ્રશ્ન {index + 1} / {total}
        </span>

        <div
          className={cn(
            CHIP,
            "flex min-w-11 items-center justify-center gap-1.5 justify-self-end px-3.5 font-canva text-[0.95rem] font-semibold tabular-nums text-[#111]",
            paused && "text-[#111]/70"
          )}
          title={paused ? "જવાબ સબમિટ થયો — સમય થંભેલો છે" : "સમય ચાલુ છે"}
        >
          <Clock className="size-[1.05rem] shrink-0" strokeWidth={1.8} />
          {formatClock(elapsedMs)}
        </div>
      </div>
    </header>
  );
}
