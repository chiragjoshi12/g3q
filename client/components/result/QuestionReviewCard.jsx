"use client";

import { useState } from "react";
import { ChevronDown } from "@/components/icons";

import { BrandIcon } from "@/components/common/BrandIcon";
import { describeAnswer, describeCorrectAnswer } from "@/lib/domain/answer-format";
import { formatDuration } from "@/lib/domain/format";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

const CARD_SHADOW = "shadow-[0_10px_28px_rgb(15_23_42/0.06)]";

/** One row of the review list. Collapsed: number, prompt, verdict, chevron. */
export function QuestionReviewCard({ index, question, row }) {
  const [open, setOpen] = useState(false);

  const given = open ? describeAnswer(question, row.answer) : [];
  const expected = open ? describeCorrectAnswer(question) : [];

  return (
    <article className={cn("overflow-hidden rounded-[1.35rem] bg-white", CARD_SHADOW)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F5F7F9] font-canva text-sm font-bold text-[#6B7280]">
          {index + 1}
        </span>

        <span className="min-w-0 flex-1 font-canva text-[15px] leading-snug font-bold text-[#111]">
          {question.prompt}
        </span>

        <BrandIcon
          src={row.correct ? BRAND_ICONS.correct : BRAND_ICONS.incorrect}
          alt=""
          className="size-5 shrink-0"
        />
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-black transition-transform duration-300 ease-emphasized",
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
          <div className="space-y-3 px-4 pb-4">
            {row.timeSpentMs > 0 ? (
              <p className="flex items-center gap-1.5 font-canva text-xs font-medium text-[#6B7280]">
                <BrandIcon src={BRAND_ICONS.time} alt="" className="size-3.5" />
                {formatDuration(row.timeSpentMs)}
              </p>
            ) : null}
            <AnswerBlock
              label="તમારો જવાબ"
              lines={given}
              tone={row.correct ? "correct" : "incorrect"}
              emptyText="કોઈ જવાબ આપ્યો નથી"
            />
            <AnswerBlock label="સાચો જવાબ" lines={expected} tone="correct" />
          </div>
        </div>
      </div>
    </article>
  );
}

function AnswerBlock({ label, lines, tone, emptyText }) {
  const tones = {
    correct: "bg-[#E6F4EA] text-[#111]",
    incorrect: "bg-[#F8E6F0] text-[#111]",
  };

  return (
    <div className="space-y-1.5">
      <p className="font-canva text-[11px] font-medium text-[#6B7280]">{label}</p>
      <div className={cn("space-y-0.5 rounded-[1.15rem] px-3.5 py-2.5 font-canva text-[13px] font-semibold", tones[tone])}>
        {lines.length > 0 ? (
          lines.map((line) => <p key={line}>{line}</p>)
        ) : (
          <p className="font-medium text-[#6B7280]">{emptyText ?? "—"}</p>
        )}
      </div>
    </div>
  );
}
