"use client";

import { useEffect } from "react";
import { X } from "@/components/icons";

import { ACTION_BUTTON_CLASS, ActionButtonRow, AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import { useTypewriter } from "@/hooks/useTypewriter";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Fun-fact sheet that opens the moment an answer is submitted.
 *
 * The body types out live while the footer reads "Checking Answer...".
 * Correct / Incorrect is held back until that typing finishes, then the
 * result stamps in with confetti (right) or a shake (wrong) so the outcome
 * is felt, not just read.
 */
export function AiExplanationSheet({
  explanation,
  correct,
  isLast = false,
  onDone,
  onDismiss,
  onContinue,
}) {
  const source = explanation?.body ?? "";
  const { text: body, done: bodyDone } = useTypewriter(source, {
    enabled: Boolean(source),
  });

  useEffect(() => {
    if (bodyDone) onDone?.();
    // Fires once, right when typing finishes — `onDone` is a fresh closure
    // each render, not a value this effect should re-run for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyDone]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-end justify-center",
        !bodyDone && "bg-black/25",
        bodyDone && correct && "animate-flash-success bg-black/28",
        bodyDone && !correct && "animate-flash-error bg-black/30"
      )}
    >
      {bodyDone ? (
        <button
          type="button"
          aria-label="બંધ કરો"
          onClick={onDismiss}
          className="absolute inset-0"
        />
      ) : (
        <div className="absolute inset-0" />
      )}

      <div className="animate-slide-up relative w-full">
        <div
          className={cn(
            "relative flex max-h-[78dvh] min-h-[48%] w-full flex-col overflow-visible rounded-t-[2rem] bg-white px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-m3"
          )}
        >
          <div className="relative mb-4 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <BrandIcon
                src={BRAND_ICONS.doYouKnow}
                alt=""
                className={cn("size-6 shrink-0", !bodyDone && "animate-pulse")}
              />
              <h2 className="font-canva inline-block bg-gradient-to-r from-[#8c52ff] to-[#5ce1e6] bg-clip-text text-xl font-bold text-transparent">
                Do you know?
              </h2>
            </div>
            {bodyDone ? (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="બંધ કરો"
                className="absolute right-0 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-[#F1F5F9] text-muted-foreground transition-transform active:scale-95"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <p className="text-[15px] leading-relaxed text-[#1F2937]">
              {body}
              {!bodyDone ? (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-[#8c52ff] align-middle" />
              ) : null}
            </p>
          </div>

          {bodyDone ? <VerdictMark correct={correct} /> : null}

          <ActionButtonRow className="mt-5">
            <AppButton
              disabled={!bodyDone}
              onClick={bodyDone ? onContinue : undefined}
              className={cn(
                ACTION_BUTTON_CLASS,
                !bodyDone && "bg-[#D6E4F0] text-foreground hover:bg-[#D6E4F0]"
              )}
            >
              {!bodyDone ? "Checking Answer..." : isLast ? "See Results" : "Next Question"}
            </AppButton>
          </ActionButtonRow>
        </div>
      </div>
    </div>
  );
}

function VerdictMark({ correct }) {
  return (
    <div className="relative mt-5 flex flex-col items-center justify-center overflow-visible py-2">
      <div className="relative grid size-28 place-items-center overflow-visible">
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full animate-pulse-ring",
            correct ? "bg-success/18" : "bg-error/14"
          )}
        />
        {correct ? <ConfettiBurst /> : null}
        <BrandIcon
          src={correct ? BRAND_ICONS.correct : BRAND_ICONS.incorrect}
          alt={correct ? "સાચો જવાબ" : "ખોટો જવાબ"}
          className="relative size-[5.25rem] animate-verdict-pop"
        />
      </div>
      <p
        className={cn(
          "mt-3 font-heading text-2xl font-bold animate-pop-in",
          correct ? "text-[#15803D]" : "text-[#B91C1C]"
        )}
      >
          {correct ? "સાચો જવાબ!" : "ખોટો જવાબ"}
      </p>
    </div>
  );
}
