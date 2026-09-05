"use client";

import { cn } from "@/lib/utils";

/**
 * Shared option row for single-choice questions.
 *
 * Selected = thick blue ring on white pill (Canva play mock).
 * Correct/incorrect styling lives on the explanation sheet, not here.
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
        "flex min-h-[3.85rem] w-full items-center justify-start rounded-[1.35rem] bg-white px-5 py-4 text-center font-canva text-[0.98rem] leading-snug text-[#111] transition-[transform,box-shadow,border-color] duration-200 ease-emphasized sm:min-h-[4.25rem] sm:text-[1.05rem]",
        !disabled && "active:scale-[0.985]",
        selected
          ? "border-[2px] border-[#2d689d]"
          : "border-[1px] border-[#d9d9d9]",
        revealed && !selected && "opacity-55"
      )}
    >
      <span className="min-w-0">{label}</span>
    </button>
  );
}
