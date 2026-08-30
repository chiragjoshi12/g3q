"use client";

import { useState } from "react";
import { ChevronDown } from "@/components/icons";

import { AiExplanationCard } from "@/components/quiz/AiExplanationCard";
import { describeAnswer, describeCorrectAnswer } from "@/lib/domain/answer-format";
import { BrandIcon } from "@/components/common/BrandIcon";
import { formatDuration } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/** One row of the review list. Collapsed: number, prompt, chevron. */
export function QuestionReviewCard({ index, question, row, explanation }) {
  const [open, setOpen] = useState(false);

  const given = open ? describeAnswer(question, row.answer) : [];
  const expected = open ? describeCorrectAnswer(question) : [];

  return (
    <article className="relative overflow-hidden rounded-[1.15rem] border border-[#EEE] bg-white">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[5px]",
          row.correct ? "bg-success" : "bg-error"
        )}
      />

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3.5 pr-3.5 pl-5 text-left"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F0F1F3] font-heading text-sm font-bold text-[#6B7280]">
          {index + 1}
        </span>

        <span className="min-w-0 flex-1 font-heading text-[15px] leading-snug font-semibold">
          {question.prompt}
        </span>

        <BrandIcon
          src={row.correct ? BRAND_ICONS.correct : BRAND_ICONS.incorrect}
          alt=""
          className="size-5 shrink-0"
        />
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#9CA3AF] transition-transform duration-300 ease-emphasized",
            open && "rotate-180"
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
          <div className="space-y-3 px-3.5 pb-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BrandIcon src={BRAND_ICONS.time} alt="" className="size-3.5" />
              {formatDuration(row.timeSpentMs)}
            </p>
            <AnswerBlock
              label="તમારો જવાબ"
              lines={given}
              tone={row.correct ? "success" : "error"}
              emptyText="કોઈ જવાબ આપ્યો નથી"
            />
            {!row.correct ? (
              <AnswerBlock label="સાચો જવાબ" lines={expected} tone="success" />
            ) : null}

            <AiExplanationCard explanation={explanation} />
          </div>
        </div>
      </div>
    </article>
  );
}

function AnswerBlock({ label, lines, tone, emptyText }) {
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "error"
        ? "bg-error/10 text-error"
        : "bg-muted text-foreground";

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <div className={cn("space-y-0.5 rounded-xl px-3 py-2 text-[13px]", toneClass)}>
        {lines.length > 0 ? (
          lines.map((line) => <p key={line}>{line}</p>)
        ) : (
          <p className="opacity-70">{emptyText ?? "—"}</p>
        )}
      </div>
    </div>
  );
}
