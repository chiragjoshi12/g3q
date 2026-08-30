"use client";

import Image from "next/image";
import { Check } from "@/components/icons";

import { BrandIcon } from "@/components/common/BrandIcon";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

export function ImageChoiceQuestion({ question, value, onChange, disabled, revealed, celebrate }) {
  const selected = value ?? [];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {question.options.map((option) => {
        const isSelected = selected.includes(option.id);
        const isCorrectOption = question.answer.includes(option.id);
        const rightPick = revealed && isCorrectOption;
        const wrongPick = revealed && isSelected && !isCorrectOption;

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange([option.id])}
            aria-pressed={isSelected}
            className={cn(
              "group relative flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border-[3px] bg-white text-left shadow-[0_8px_24px_rgb(15_23_42/0.06)] transition-all duration-200 ease-emphasized md:rounded-[1.5rem]",
              !disabled && "hover:-translate-y-0.5 active:scale-[0.98]",
              !revealed && isSelected && "border-primary-600 ring-4 ring-primary-100",
              !revealed && !isSelected && "border-transparent",
              rightPick && "border-success ring-4 ring-success/25",
              wrongPick && "border-error ring-4 ring-error/25",
              revealed && !rightPick && !wrongPick && "border-transparent opacity-50 grayscale"
            )}
          >
            <div className="relative aspect-[4/3] w-full min-h-0 flex-1 bg-muted">
              <Image
                src={option.image}
                alt={option.label}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 42vw, 560px"
                className="object-cover"
              />

              {!revealed && isSelected ? (
                <span className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-primary-600 text-white shadow-m2 md:size-10">
                  <Check className="size-4 md:size-5" strokeWidth={3} />
                </span>
              ) : null}

              {rightPick || wrongPick ? (
                <div
                  className={cn(
                    "absolute inset-0 grid place-items-center",
                    rightPick ? "bg-success/40" : "bg-error/50"
                  )}
                >
                  <div className="relative grid place-items-center overflow-visible">
                    {rightPick ? <ConfettiBurst /> : null}
                    <BrandIcon
                      src={rightPick ? BRAND_ICONS.correct : BRAND_ICONS.incorrect}
                      alt=""
                      className="relative size-16 animate-verdict-pop md:size-20"
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <p
              className={cn(
                "shrink-0 px-3 py-2.5 font-canva text-sm leading-snug font-semibold md:px-4 md:py-3 md:text-base",
                !revealed && isSelected && "bg-primary-50 text-primary-800",
                rightPick && "bg-success text-white",
                wrongPick && "bg-error text-white",
                revealed && !rightPick && !wrongPick && "text-muted-foreground"
              )}
            >
              {option.label}
            </p>
          </button>
        );
      })}
    </div>
  );
}
