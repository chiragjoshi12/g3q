"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { QUESTION_REWRITES, type RewriteItem } from "@/data/question-rewrites";

const LETTERS = ["A", "B", "C", "D"];

function OptionList({
  options,
  answer,
  tone = "before",
}: {
  options: string[];
  answer: string;
  tone?: "before" | "after";
}) {
  const baseTone =
    tone === "before"
      ? "border-[#eadfd4] bg-[#fbf6f1] text-[#4a3b32]"
      : "border-[#dbe7f2] bg-[#f4f8fb] text-[#143250]";
  const answerTone =
    tone === "before" ? "border-[#d9c5b5] bg-[#f4e8df]" : "border-[#bfd9c4] bg-[#effaf2]";

  return (
    <div className="grid gap-2">
      {options.map((opt, i) => {
        const isAnswer = opt === answer;
        return (
          <div
            key={`${i}-${opt}`}
            className={`flex min-h-11 items-start gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm leading-snug ${baseTone} ${isAnswer ? answerTone : ""}`}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold">
              {LETTERS[i]}
            </span>
            <div className="min-w-0">
              <span>{opt}</span>
              {isAnswer ? (
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">
                  Correct answer
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AfterPanel({ item }: { item: RewriteItem }) {
  return (
    <>
      {item.after.facts?.length ? (
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm leading-6 text-[#4c657d]">
          {item.after.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}
      {item.after.hint ? (
        <p className="mb-3 text-sm leading-6 text-[#4c657d]">{item.after.hint}</p>
      ) : null}
      <p className="mb-4 text-[1.02rem] font-semibold leading-[1.7] text-[#143250]">
        {item.after.question}
      </p>
      <OptionList options={item.after.options} answer={item.after.answer} tone="after" />
    </>
  );
}

export function QuestionRewriteDemo() {
  const [index, setIndex] = useState(0);
  const [mobileView, setMobileView] = useState<"before" | "after">("before");
  const item = QUESTION_REWRITES[index];
  const total = QUESTION_REWRITES.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  if (!item) return null;

  return (
    <div className="min-h-dvh bg-[#eceff3] text-[#1a2430]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[#2c6698]">
            G3Q Analytics
          </Link>
          <span className="ml-auto text-sm font-semibold text-[#143250]">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={isFirst}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#d8e0ea] bg-white disabled:opacity-40"
            aria-label="Previous question"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((current) => Math.min(total - 1, current + 1))}
            disabled={isLast}
            className="inline-flex size-10 items-center justify-center rounded-full bg-[#2c6698] text-white disabled:opacity-40"
            aria-label="Next question"
          >
            ›
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <div className="hidden gap-4 lg:grid lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-[#eadfd4] bg-[#faf6f2] p-5">
            <div className="mb-3 inline-flex rounded-full bg-[#c2410c] px-3 py-1 text-xs font-bold text-white">
              પહેલાં
            </div>
            <p className="mb-4 text-[0.98rem] leading-[1.8] text-[#4a3b32]">{item.before.question}</p>
            <OptionList options={item.before.options} answer={item.before.answer} tone="before" />
          </article>
          <article className="rounded-[1.5rem] border border-[#dbe7f2] bg-[#f8fbff] p-5">
            <div className="mb-3 inline-flex rounded-full bg-[#15803d] px-3 py-1 text-xs font-bold text-white">
              પછી
            </div>
            <AfterPanel item={item} />
          </article>
        </div>

        <div className="lg:hidden">
          {mobileView === "before" ? (
            <article className="rounded-[1.6rem] border border-[#eadfd4] bg-[#faf6f2] p-5">
              <p className="mb-4 text-[0.98rem] leading-[1.8] text-[#4a3b32]">{item.before.question}</p>
              <OptionList options={item.before.options} answer={item.before.answer} tone="before" />
            </article>
          ) : (
            <article className="rounded-[1.6rem] border border-[#dbe7f2] bg-[#f8fbff] p-5">
              <AfterPanel item={item} />
            </article>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-4 z-30 px-4 lg:hidden">
        <div className="mx-auto flex max-w-md gap-2 rounded-[1.6rem] border border-[#d8e0ea] bg-white/92 p-2">
          <button
            type="button"
            onClick={() => setMobileView("before")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${mobileView === "before" ? "bg-[#c2410c] text-white" : "text-[#4a3b32]"}`}
          >
            પહેલાં
          </button>
          <button
            type="button"
            onClick={() => setMobileView("after")}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${mobileView === "after" ? "bg-[#15803d] text-white" : "text-[#143250]"}`}
          >
            પછી
          </button>
        </div>
      </div>
    </div>
  );
}
