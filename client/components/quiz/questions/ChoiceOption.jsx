"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { ConfettiBurst } from "@/components/quiz/ConfettiBurst";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Shared option row for single-choice questions.
 *
 * `revealed` switches it from selection styling to grading styling, which is
 * what the review phase after Submit renders.
 */
export function ChoiceOption({
  label,
  selected,
  revealed,
  isCorrectOption,
  disabled,
  onToggle,
  celebrate,
}) {
  const wrongPick = revealed && selected && !isCorrectOption;
  const rightPick = revealed && isCorrectOption;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "w-full overflow-visible rounded-[1.35rem] border-2 bg-white px-5 py-4 text-left font-canva text-sm leading-snug font-medium transition-all duration-200 ease-emphasized sm:text-base",
        !disabled && "active:scale-[0.99]",
        !revealed && selected && "border-primary-600 bg-primary-50",
        !revealed && !selected && "border-[#E8ECF0] hover:border-primary-300",
        rightPick && "border-success bg-success/10 shadow-[0_0_0_4px_rgb(22_163_74/0.15)]",
        wrongPick && "border-error bg-error/10 shadow-[0_0_0_4px_rgb(220_38_38/0.12)] animate-verdict-shake",
        revealed && !rightPick && !wrongPick && "border-[#E8ECF0] opacity-60"
      )}
    >
      <span className="flex items-center gap-3">
        <span className="min-w-0 flex-1">{label}</span>
        {rightPick ? (
          <span className="relative z-10 grid size-8 shrink-0 place-items-center md:size-9">
            <ConfettiBurst size="sm" />
            <BrandIcon src={BRAND_ICONS.correct} alt="" className="relative size-8 animate-verdict-pop md:size-9" />
          </span>
        ) : null}
        {wrongPick ? (
          <BrandIcon src={BRAND_ICONS.incorrect} alt="" className="size-8 shrink-0 animate-verdict-pop md:size-9" />
        ) : null}
      </span>
    </button>
  );
}
