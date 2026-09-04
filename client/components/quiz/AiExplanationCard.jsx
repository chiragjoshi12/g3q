"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "@/components/icons";

import { ChatMarkdown } from "@/components/g3q-ai/ChatMarkdown";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn } from "@/lib/utils";

/**
 * AI-style explanation, loaded from JSON alongside the question.
 *
 * `defaultOpen` reveals it without the user tapping anything — used right
 * after a question is submitted. `animated` types the body out a couple of
 * characters at a time so it reads like the AI is writing it live, and fires
 * `onDone` the moment it finishes — the quiz screen uses that to hold back
 * the correct/wrong verdict until the explanation has fully written itself
 * out. The result screen's review list passes neither, since a user
 * re-opening a past answer wants the full text immediately, not a replay.
 */
export function AiExplanationCard({ explanation, defaultOpen = false, animated = false, onDone }) {
  const [open, setOpen] = useState(defaultOpen);

  const { text: body, done: bodyDone } = useTypewriter(explanation?.body, {
    enabled: animated && open,
  });

  useEffect(() => {
    if (animated && bodyDone) onDone?.();
    // Fires once per question — `onDone` is a fresh closure each render, not
    // a value this effect should re-run for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, bodyDone]);

  if (!explanation) return null;

  const showKeyPoints = !animated || bodyDone;
  // Collapsing mid-type would hide the very thing the verdict is waiting on.
  const lockedOpen = animated && open && !bodyDone;

  return (
    <section className="animate-slide-up overflow-hidden rounded-xl border border-border border-l-[3px] border-l-primary-500 bg-surface">
      <button
        type="button"
        onClick={() => {
          if (lockedOpen) return;
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-disabled={lockedOpen}
        className="flex w-full items-start gap-2.5 p-3.5 text-left"
      >
        <Sparkles
          className={cn(
            "mt-0.5 size-4 shrink-0 text-primary-600",
            lockedOpen && "animate-pulse"
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="font-heading text-sm font-semibold text-foreground">
            AI સમજૂતી
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
            {explanation.summary}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-emphasized",
            open && "rotate-180",
            lockedOpen && "opacity-30"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-emphasized",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border px-3.5 pt-3 pb-3.5">
            <div className="relative text-foreground/80">
              <ChatMarkdown className="text-foreground/80" style={{ fontSize: 13 }}>
                {animated ? body : explanation.body}
              </ChatMarkdown>
              {animated && !bodyDone ? (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-primary-600 align-middle" />
              ) : null}
            </div>

            {showKeyPoints && explanation.keyPoints?.length ? (
              <ul className="space-y-1.5">
                {explanation.keyPoints.map((point, index) => (
                  <li
                    key={point}
                    className={cn(
                      "flex items-start gap-2 text-[13px]",
                      animated && "animate-slide-up"
                    )}
                    style={animated ? { animationDelay: `${index * 120}ms` } : undefined}
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                    <span className="text-foreground/80">
                      <ChatMarkdown className="text-foreground/80" style={{ fontSize: 13 }}>
                        {point}
                      </ChatMarkdown>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="text-[11px] text-muted-foreground/70">
              {animated && !bodyDone
                ? "AI લખી રહ્યું છે… જવાબ સાચો છે કે ખોટો તે પછી બતાવાશે."
                : `AI જનરેટેડ · ${explanation.model}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
