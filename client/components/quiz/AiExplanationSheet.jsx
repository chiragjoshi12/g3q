"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { X } from "@/components/icons";

import { ACTION_BUTTON_CLASS, ActionButtonRow, AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { ChatMarkdown, decodeAiLineBreaks } from "@/components/g3q-ai/ChatMarkdown";
import { useTypewriter } from "@/hooks/useTypewriter";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { playAnswerSound } from "@/lib/quiz-sounds";
import { cn } from "@/lib/utils";
import { DESKTOP_OVERLAY } from "@/components/layout/desktop-overlay";

const TYPEWRITER_INTERVAL_MS = 26;
const MIN_STREAM_DURATION_MS = 2600;
const MAX_STREAM_DURATION_MS = 4200;
const PROGRESS_COMPLETE_DELAY_MS = 320;
/** Wait after explanation finishes typing before showing correct/incorrect. */
const RESULT_REVEAL_DELAY_MS = 0;

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
  const { t } = useI18n();
  const source = decodeAiLineBreaks(explanation?.body ?? "").replace(/\n+/g, "\n\n");
  const streamDurationMs = Math.min(
    MAX_STREAM_DURATION_MS,
    Math.max(MIN_STREAM_DURATION_MS, source.length * 4.2)
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
  const [desktopBox, setDesktopBox] = useState(null);

  useLayoutEffect(() => {
    const place = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const card = document.querySelector("[data-quiz-question-card]");
      const frame = document.querySelector("[data-app-frame]");
      if (!desktop || !card || !frame) {
        setDesktopBox(null);
        return;
      }
      const cardRect = card.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      setDesktopBox({
        width: Math.min(cardRect.width, 520),
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);
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
    // Keep the progress bar filling until just before the result stamp.
    const progressTimer = window.setTimeout(
      () => setProgressComplete(true),
      Math.max(PROGRESS_COMPLETE_DELAY_MS, RESULT_REVEAL_DELAY_MS - 500)
    );
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
        DESKTOP_OVERLAY,
        !bodyDone && "bg-black/25",
        bodyDone && correct && "animate-flash-success bg-black/28",
        bodyDone && !correct && "animate-flash-error bg-black/30"
      )}
    >
      {bodyDone ? (
        <button
          type="button"
          aria-label={t("close")}
          onClick={onDismiss}
          className="absolute inset-0"
        />
      ) : (
        <div className="absolute inset-0" />
      )}

      <div
        className="animate-slide-up relative w-full lg:w-auto"
        style={desktopBox ? { width: `${desktopBox.width}px` } : undefined}
      >
        <div
          className={cn(
            "relative flex w-full flex-col overflow-hidden rounded-t-[2rem] bg-white px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-m3 lg:rounded-[1.75rem] lg:px-7 lg:pt-5 lg:pb-5 lg:shadow-[0_24px_64px_rgb(15_23_42/0.18)]",
            bodyDone
              ? "h-auto max-h-[86dvh] max-lg:min-h-[30rem]"
              : "h-[68dvh] max-lg:min-h-[30rem] lg:h-auto lg:max-h-[min(28rem,72dvh)]"
          )}
        >
          {!bodyDone ? (
            <>
              <div className="pointer-events-none absolute -top-16 left-1/2 h-36 w-56 -translate-x-1/2 rounded-full bg-[#2d689d]/14 blur-3xl" />
              <div className="pointer-events-none absolute right-0 top-12 h-32 w-32 rounded-full bg-[#00bf63]/12 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            </>
          ) : null}

          <div className="relative mb-6 flex shrink-0 flex-col items-center justify-center gap-2.5 lg:mb-7">
            <div className="relative flex w-full items-center justify-center">
              <div className="flex items-center gap-2">
                <BrandIcon
                  src={BRAND_ICONS.doYouKnow}
                  alt=""
                  className={cn("size-6 shrink-0", !bodyDone && "animate-pulse")}
                />
                <h2 className="font-canva inline-block bg-gradient-to-r from-[#8c52ff] to-[#5ce1e6] bg-clip-text text-xl font-bold text-transparent">
                  {t("didYouKnow")}
                </h2>
              </div>
              {bodyDone ? (
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label={t("close")}
                  className="absolute right-0 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-[#f5f5f5] text-muted-foreground transition-transform active:scale-95"
                >
                  <X className="size-7 text-[#111]" />
                </button>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "min-h-0 text-[#1F2937]",
              bodyDone
                ? "overflow-visible"
                : "no-scrollbar flex-1 overflow-y-auto overscroll-contain lg:flex-none lg:max-h-[12rem]"
            )}
          >
            <div className="relative text-[#1F2937]">
              <ChatMarkdown
                className="font-canva text-[1rem] leading-snug text-[#1F2937] sm:text-[1.1rem] [&_p]:my-3.5 lg:[&_p]:my-2"
                style={{ fontSize: undefined, fontFamily: undefined }}
              >
                {body}
              </ChatMarkdown>
            </div>
          </div>

          <div className="mt-1 max-lg:min-h-[5.75rem] lg:mt-3">
            {bodyDone ? <VerdictMark correct={correct} /> : null}
          </div>

          <ActionButtonRow className={cn("mt-5 shrink-0", !bodyDone ? "lg:mt-8" : "lg:mt-4")}>
            {!bodyDone ? (
              <CheckingAnswerButton progress={checkingProgress} />
            ) : (
              <AppButton
                onClick={onContinue}
                className={ACTION_BUTTON_CLASS}
              >
                {isLast ? t("viewResult") : t("nextQuestion")}
              </AppButton>
            )}
          </ActionButtonRow>
        </div>
      </div>
    </div>
  );
}

function CheckingAnswerButton({ progress }) {
  const { t } = useI18n();
  return (
    <div className="animate-ai-check-run-border relative w-[62%] rounded-full p-[1.5px]">
      <div className="rounded-full bg-[#D6E4F0]">
        <AppButton
          disabled
          block
          className="relative z-10 max-w-none overflow-hidden bg-transparent text-[#1F2937] shadow-none hover:bg-transparent disabled:bg-transparent disabled:text-[#1F2937] disabled:opacity-100"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#b99cff] to-[#a9f5f7] opacity-85 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
          <span className="relative z-10 whitespace-nowrap text-[0.92rem] leading-none sm:text-[0.96rem]">
            {t("checkingAnswer")}...
          </span>
        </AppButton>
      </div>
    </div>
  );
}

function VerdictMark({ correct }) {
  const { t } = useI18n();
  return (
    <div className="relative mt-[-4] flex flex-col items-center justify-center overflow-visible py-2 lg:mt-1 lg:py-0">
      <div className="relative grid size-28 place-items-center overflow-visible lg:size-14">
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full animate-pulse-ring",
            correct ? "bg-success/18" : "bg-error/14"
          )}
        />
        <BrandIcon
          src={correct ? BRAND_ICONS.correct : BRAND_ICONS.incorrect}
          alt={correct ? t("correctAnswer") : t("incorrect")}
          className="relative size-[4rem] animate-verdict-pop lg:size-8"
        />
      </div>
      <p
        className={cn(
          "mt-[-3] font-heading text-[18px] font-bold animate-pop-in lg:mt-0.5 lg:text-[14px]",
          correct ? "text-[#15803D]" : "text-[#B91C1C]"
        )}
      >
          {correct ? `${t("correctAnswer")}!` : t("incorrect")}
      </p>
    </div>
  );
}

