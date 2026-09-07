"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
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

const MOBILE_VIEW_ITEMS = [
  { id: "before", label: "પહેલાં" },
  { id: "after", label: "પછી" },
];

function PreviewAnswer({ answer }) {
  if (!answer) return null;

  return (
    <div className="mt-4 rounded-[1.15rem] bg-white/80 px-3.5 py-3 text-sm text-[#245580] ring-1 ring-[#d7e5f2]">
      <span className="font-semibold text-[#143250]">સાચો જવાબ:</span> {answer}
    </div>
  );
}

function ImprovedPreview({ item, response, onChange }) {
  return (
    <>
      {item.after.intro ? (
        <p className="mb-3 text-sm leading-6 text-[#4c657d]">{item.after.intro}</p>
      ) : null}

      <p className="mb-4 text-[1.02rem] font-semibold leading-[1.7] text-[#143250]">
        {item.after.question}
      </p>

      <QuestionRenderer
        question={item.after.previewQuestion}
        value={response}
        onChange={onChange}
        disabled={false}
        revealed={false}
      />

      <PreviewAnswer answer={item.after.answerText} />
    </>
  );
}

function RewriteCard({
  item,
  mobileView,
  response,
  onResponseChange,
}) {
  const showBeforeMobile = mobileView === "before";

  return (
    <section className="rounded-[2rem] p-0 sm:p-6">

      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
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
          <ImprovedPreview
            item={item}
            response={response}
            onChange={onResponseChange}
          />
        </article>
      </div>

      <div className="lg:hidden">
        {showBeforeMobile ? (
          <article className="-mx-1 rounded-[1.6rem] border border-[#eadfd4] bg-[#faf6f2] p-5">
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
        ) : (
          <article className="-mx-1 rounded-[1.6rem] border border-[#dbe7f2] bg-[#f8fbff] p-5">
            <div className="mb-3 inline-flex rounded-full bg-[#15803d] px-3 py-1 text-xs font-bold text-white">
              પછી
            </div>

            <ImprovedPreview
              item={item}
              response={response}
              onChange={onResponseChange}
            />
          </article>
        )}
      </div>
    </section>
  );
}

function NavChevron({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M14.5 5.5 8.5 12l6 6.5" />
      ) : (
        <path d="M9.5 5.5 15.5 12l-6 6.5" />
      )}
    </svg>
  );
}

export function QuestionRewriteDemo() {
  const [index, setIndex] = useState(0);
  const [mobileView, setMobileView] = useState("before");
  const [responses, setResponses] = useState({});
  const item = QUESTION_REWRITES[index];
  const total = QUESTION_REWRITES.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

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
              G3Q 3.0
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              disabled={isFirst}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full border",
                isFirst
                  ? "cursor-not-allowed border-[#d8e0ea] bg-[#f4f6f8] text-[#9aa8b6]"
                  : "border-[#d8e0ea] bg-white text-[#143250] hover:bg-[#f4f8fb] active:scale-[0.98]"
              )}
              aria-label="Previous question"
            >
              <NavChevron direction="left" />
            </button>
            {/* write the question number between the next and previous buttons */}
            <span className="text-sm font-semibold text-[#143250]">
              {index + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setIndex((current) => Math.min(total - 1, current + 1))}
              disabled={isLast}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full",
                isLast
                  ? "cursor-not-allowed bg-[#9bb8d4] text-white"
                  : "bg-[#2c6698] text-white hover:bg-[#245580] active:scale-[0.98]"
              )}
              aria-label="Next question"
            >
              <NavChevron direction="right" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <RewriteCard
          item={item}
          index={index}
          total={total}
          mobileView={mobileView}
          response={responses[item.id]}
          onResponseChange={(next) =>
            setResponses((current) => ({ ...current, [item.id]: next }))
          }
        />
      </main>

      <div className="fixed inset-x-0 bottom-4 z-30 px-4 lg:hidden">
        <div className="mx-auto max-w-md rounded-[1.6rem] border border-[#d8e0ea] bg-white/92 p-2 shadow-[0_18px_44px_rgb(15_23_42/0.16)] backdrop-blur">
          <SegmentedToggle
            items={MOBILE_VIEW_ITEMS}
            value={mobileView}
            onChange={setMobileView}
          />
        </div>
      </div>
    </div>
  );
}
