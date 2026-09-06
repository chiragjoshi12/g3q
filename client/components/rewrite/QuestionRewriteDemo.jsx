"use client";

import Image from "next/image";
import Link from "next/link";

import { QUESTION_REWRITES } from "@/data/question-rewrites";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

function OptionList({ options, answer, tone = "before" }) {
  const baseTone =
    tone === "before"
      ? "border-[#eadfd4] bg-[#fbf6f1] text-[#4a3b32]"
      : "border-[#dbe7f2] bg-[#f4f8fb] text-[#143250]";

  const answerTone =
    tone === "before"
      ? "border-[#d9c5b5] bg-[#f4e8df]"
      : "border-[#bfd9c4] bg-[#effaf2]";

  return (
    <div className="grid gap-2">
      {options.map((opt, i) => {
        const isAnswer = opt === answer;
        return (
          <div
            key={`${i}-${opt}`}
            className={cn(
              "flex min-h-11 items-start gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm leading-snug sm:text-[0.95rem]",
              baseTone,
              isAnswer && answerTone
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                tone === "before"
                  ? "bg-white text-[#a05a2c]"
                  : "bg-white text-[#2c6698]"
              )}
            >
              {LETTERS[i]}
            </span>
            <div className="min-w-0">
              <span>{opt}</span>
              {isAnswer ? (
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">
                  Correct Answer
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RewriteCard({ item, index }) {
  return (
    <section className="rounded-[2rem] border border-[#d8e0ea] bg-white p-4 shadow-m2 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#2c6698] text-sm font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a7a8a]">
              Department
            </p>
            <h2 className="text-base font-bold text-[#143250] sm:text-lg">
              {item.department}
            </h2>
          </div>
        </div>
        <div className="rounded-full bg-[#eef3f7] px-3 py-1 text-xs font-semibold text-[#2c6698]">
          Before vs After
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[#eadfd4] bg-[#faf6f2] p-4 sm:p-5">
          <div className="mb-3 inline-flex rounded-full bg-[#c2410c] px-3 py-1 text-xs font-bold text-white">
            પહેલાં
          </div>
          <p className="mb-4 text-[0.98rem] leading-[1.8] text-[#4a3b32]">
            {item.before.question}
          </p>
          <OptionList
            options={item.before.options}
            answer={item.before.answer}
            tone="before"
          />
        </article>

        <article className="rounded-[1.5rem] border border-[#dbe7f2] bg-[#f8fbff] p-4 sm:p-5">
          <div className="mb-3 inline-flex rounded-full bg-[#15803d] px-3 py-1 text-xs font-bold text-white">
            પછી
          </div>

          {item.after.facts?.length ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {item.after.facts.map((fact) => (
                <span
                  key={fact}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#245580] ring-1 ring-[#d7e5f2]"
                >
                  {fact}
                </span>
              ))}
            </div>
          ) : null}

          <p className="mb-4 text-[1.02rem] font-semibold leading-[1.7] text-[#143250]">
            {item.after.question}
          </p>
          <OptionList
            options={item.after.options}
            answer={item.after.answer}
            tone="after"
          />
        </article>
      </div>
    </section>
  );
}

export function QuestionRewriteDemo() {
  return (
    <div className="min-h-dvh bg-[#eceff3] text-[#1a2430]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <Image
              src={BRAND_ICONS.logo}
              alt="G3Q"
              width={48}
              height={48}
              priority
              className="size-11 object-contain"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2c6698]">
              G3Q 2.0
            </p>
            <h1 className="text-lg font-bold text-primary-700 sm:text-2xl">
              સરળ Before / After Overview
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="rounded-[2rem] bg-[#143250] px-5 py-5 text-white shadow-m2 sm:px-6">
          <p className="text-sm leading-7 text-white/85 sm:text-base">
            નીચે બધા ૨૦ પ્રશ્નોનું સીધું comparison છે. ડાબી બાજુ મૂળ અઘરું
            version, જમણી બાજુ સરળ અને સમજાય એવું version.
          </p>
        </section>

        {QUESTION_REWRITES.map((item, index) => (
          <RewriteCard key={item.id} item={item} index={index} />
        ))}
      </main>
    </div>
  );
}
