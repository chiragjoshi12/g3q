"use client";

import { cn } from "@/lib/utils";

/**
 * Shared option row for single-choice questions.
 *
 * After submit the pick stays as-is (locked). Correct vs incorrect is shown
 * on the explanation sheet, not by recoloring options.
 */
export function ChoiceOption({
  label,
  selected,
  revealed,
  disabled,
  onToggle,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[4.5rem] w-full items-center rounded-[1.40rem] border bg-white px-5 py-5 text-left font-canva text-sm leading-snug font-medium transition-colors duration-200 ease-emphasized sm:min-h-[5rem] sm:py-6 sm:text-base",
        !disabled && "active:scale-[0.99]",
        selected && "border-primary-600 bg-primary-50",
        !selected && "border-[#E8ECF0]",
        !revealed && !selected && "hover:border-primary-300",
        revealed && !selected && "opacity-60"
      )}
    >
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}
