"use client";

import { Noto_Sans_Gujarati } from "next/font/google";

import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
import { QUESTION_REWRITES } from "@/data/question-rewrites";

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "G3Q Before After Print",
  description: "Printable before and after comparison for 20 questions.",
};

const LETTERS = ["A", "B", "C", "D"];

function OptionPill({ label, index, isAnswer = false, tone = "before" }) {
  const tones =
    tone === "before"
      ? {
          card: "border-[#eadfd4] bg-[#fbf6f1] text-[#4a3b32]",
          badge: "bg-white text-[#a05a2c]",
          answer: "border-[#d9c5b5] bg-[#f4e8df]",
        }
      : {
          card: "border-[#dbe7f2] bg-[#f4f8fb] text-[#143250]",
          badge: "bg-white text-[#2c6698]",
          answer: "border-[#bfd9c4] bg-[#effaf2]",
        };

  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 text-sm leading-6 ${tones.card} ${isAnswer ? tones.answer : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${tones.badge}`}
        >
          {index}
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
}

function BeforeOptions({ before }) {
  return (
    <div className="mt-4 grid gap-2">
      {before.options.map((option, idx) => (
        <OptionPill
          key={`${before.question}-${idx}`}
          index={LETTERS[idx]}
          label={option}
          isAnswer={option === before.answer}
          tone="before"
        />
      ))}
    </div>
  );
}

function renderBlankSegments(segments = []) {
  return segments
    .map((segment) =>
      segment.type === "blank" ? "_____" : `${segment.value}`.trim()
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function AfterOptions({ after }) {
  const preview = after.previewQuestion;

  if (!preview) return null;

  if (preview.type === "single_choice" || preview.type === "true_false") {
    return (
      <div className="mt-4 grid gap-2">
        {preview.options.map((option, idx) => (
          <OptionPill
            key={`${after.question}-${option.id ?? idx}`}
            index={LETTERS[idx] ?? idx + 1}
            label={option.label}
            isAnswer={option.label === after.answerText}
            tone="after"
          />
        ))}
      </div>
    );
  }

  if (preview.type === "drag_into_blanks") {
    return (
      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-[#dbe7f2] bg-[#f4f8fb] px-3 py-3 text-sm leading-6 text-[#143250]">
          {renderBlankSegments(preview.segments)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {preview.bank.map((option, idx) => (
            <OptionPill
              key={`${after.question}-${option.id ?? idx}`}
              index={LETTERS[idx] ?? idx + 1}
              label={option.label}
              tone="after"
            />
          ))}
        </div>
      </div>
    );
  }

  if (preview.type === "match_following") {
    return (
      <div className="mt-4 grid gap-3">
        <div className="grid gap-2">
          {preview.left.map((option, idx) => (
            <OptionPill
              key={`${after.question}-left-${option.id ?? idx}`}
              index={idx + 1}
              label={option.label}
              tone="after"
            />
          ))}
        </div>
        <div className="grid gap-2">
          {preview.right.map((option, idx) => (
            <OptionPill
              key={`${after.question}-right-${option.id ?? idx}`}
              index={String.fromCharCode(65 + idx)}
              label={option.label}
              tone="after"
            />
          ))}
        </div>
      </div>
    );
  }

  if (preview.type === "drag_drop") {
    return (
      <div className="mt-4 grid gap-2">
        {preview.items.map((option, idx) => (
          <OptionPill
            key={`${after.question}-${option.id ?? idx}`}
            index={option.id ?? idx + 1}
            label={option.label}
            tone="after"
          />
        ))}
      </div>
    );
  }

  return null;
}

function PreviewAnswer({ answer }) {
  if (!answer) return null;

  return (
    <div className="mt-4 rounded-[1.15rem] bg-white/80 px-3.5 py-3 text-sm text-[#245580] ring-1 ring-[#d7e5f2]">
      <span className="font-semibold text-[#143250]">સાચો જવાબ:</span> {answer}
    </div>
  );
}

function ImprovedPreview({ item }) {
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
        value={null}
        onChange={() => {}}
        disabled={false}
        revealed={false}
      />

      <PreviewAnswer answer={item.after.answerText} />
    </>
  );
}

function PrintQuestion({ item, index }) {
  return (
    <article className="print-row border-b border-[#d9d9d9] py-4">
      <div className="mb-2 text-xs font-semibold tabular-nums text-[#5b6775]">
        Q{index + 1}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <section className="break-inside-avoid rounded-xl border border-[#eadfd4] bg-[#faf6f2] p-4">
          <div className="mb-3 inline-flex rounded-full bg-[#c2410c] px-3 py-1 text-xs font-bold text-white">
            Before
          </div>
          <p className="text-[15px] leading-7 text-[#4a3b32]">
            {item.before.question}
          </p>
          <BeforeOptions before={item.before} />
        </section>

        <section className="break-inside-avoid rounded-xl border border-[#dbe7f2] bg-[#f8fbff] p-4">
          <div className="mb-3 inline-flex rounded-full bg-[#15803d] px-3 py-1 text-xs font-bold text-white">
            After
          </div>
          <ImprovedPreview item={item} />
        </section>
      </div>
    </article>
  );
}

export default function QuestionRewritePrintPage() {
  return (
    <div className={gujarati.className}>
      <main className="mx-auto w-full max-w-[1100px] bg-white px-6 py-6 text-black">
        {QUESTION_REWRITES.map((item, index) => (
          <PrintQuestion key={item.id} item={item} index={index} />
        ))}
      </main>

      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          html, body {
            background: #fff;
          }

          .print-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
