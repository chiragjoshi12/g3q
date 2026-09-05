"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";

import { ACTION_BUTTON_CLASS, ActionButtonRow, AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { ChatMarkdown } from "@/components/g3q-ai/ChatMarkdown";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import { useTypewriter } from "@/hooks/useTypewriter";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { playAnswerSound } from "@/lib/quiz-sounds";
import { cn } from "@/lib/utils";

const TYPEWRITER_INTERVAL_MS = 24;
const MIN_STREAM_DURATION_MS = 3000;
const MAX_STREAM_DURATION_MS = 5000;
const PROGRESS_COMPLETE_DELAY_MS = 800;
const RESULT_REVEAL_DELAY_MS = 1200;

/**
 * Fun-fact sheet that opens the moment an answer is submitted.
 *
 * The explanation is visible while the footer reads "Checking Answer...".
 * A gradient progress border fills around the button, then the result stamps in
 * with confetti (right) or a shake (wrong) so the outcome is felt, not just read.
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
  const streamDurationMs = Math.min(
    MAX_STREAM_DURATION_MS,
    Math.max(MIN_STREAM_DURATION_MS, source.length * 3.4)
  );
  const charsPerTick = Math.min(3, Math.max(
    1,
    Math.ceil(source.length / (streamDurationMs / TYPEWRITER_INTERVAL_MS))
  ));
  const { text: body, done: bodyTypedDone } = useTypewriter(source, {
    enabled: Boolean(source),
    charsPerTick,
    intervalMs: TYPEWRITER_INTERVAL_MS,
  });
  const [progressComplete, setProgressComplete] = useState(false);
  const [completionPauseDone, setCompletionPauseDone] = useState(false);
  const checkingProgress = source
    ? progressComplete
      ? 100
      : Math.min(98, Math.round((body.length / source.length) * 98))
    : 100;
  const bodyDone = completionPauseDone;

  useEffect(() => {
    if (!bodyTypedDone) return undefined;
    const progressTimer = window.setTimeout(() => setProgressComplete(true), PROGRESS_COMPLETE_DELAY_MS);
    const revealTimer = window.setTimeout(() => setCompletionPauseDone(true), RESULT_REVEAL_DELAY_MS);
    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(revealTimer);
    };
  }, [bodyTypedDone]);

  useEffect(() => {
    if (!bodyDone) return;
    onDone?.();
    playAnswerSound(Boolean(correct));
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
          className="relative flex max-h-[78dvh] min-h-[48%] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-m3"
        >
          {!bodyDone ? (
            <>
              <div className="pointer-events-none absolute -top-16 left-1/2 h-36 w-56 -translate-x-1/2 rounded-full bg-[#2d689d]/14 blur-3xl" />
              <div className="pointer-events-none absolute right-0 top-12 h-32 w-32 rounded-full bg-[#00bf63]/12 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            </>
          ) : null}

          <div className="relative mb-4 flex flex-col items-center justify-center gap-2.5">

            <div className="relative flex w-full items-center justify-center">
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
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="relative text-[#1F2937]">
              <ChatMarkdown className="text-[#1F2937]" style={{ fontSize: 15 }}>
                {body}
              </ChatMarkdown>
            </div>
          </div>

          {bodyDone ? <VerdictMark correct={correct} /> : null}

          <ActionButtonRow className="mt-5">
            {!bodyDone ? (
              <div className="relative w-[70%]">
                <CheckingButtonProgress progress={checkingProgress} />
                <AppButton
                  disabled
                  block
                  className="max-w-none bg-[#D6E4F0] text-foreground shadow-none hover:bg-[#D6E4F0] disabled:bg-[#D6E4F0] disabled:text-foreground disabled:opacity-100"
                >
                  Checking Answer...
                </AppButton>
              </div>
            ) : (
              <AppButton
                onClick={onContinue}
                className={ACTION_BUTTON_CLASS}
              >
                {isLast ? "See Results" : "Next Question"}
              </AppButton>
            )}
          </ActionButtonRow>
        </div>
      </div>
    </div>
  );
}

function CheckingButtonProgress({ progress }) {
  const strokeDashoffset = 100 - progress;

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-[5px] h-[calc(100%+10px)] w-[calc(100%+10px)] overflow-visible"
    >
      <defs>
        <linearGradient id="checking-button-gradient" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C5CE0" />
          <stop offset="42%" stopColor="#2D689D" />
          <stop offset="72%" stopColor="#61A5D8" />
          <stop offset="100%" stopColor="#00BF63" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="96"
        height="20"
        rx="10"
        fill="none"
        stroke="#DFEAF3"
        strokeWidth="3"
        pathLength="100"
      />
      <rect
        x="2"
        y="2"
        width="96"
        height="20"
        rx="10"
        fill="none"
        stroke="url(#checking-button-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        className="transition-[stroke-dashoffset] duration-75 ease-out"
        style={{
          strokeDasharray: 100,
          strokeDashoffset,
        }}
      />
    </svg>
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
        {correct ? <ConfettiBurst celebrate /> : null}
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

