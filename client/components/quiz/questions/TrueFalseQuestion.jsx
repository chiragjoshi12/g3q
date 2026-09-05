"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    id: "true",
    label: "સાચું",
    icon: "/icons/correct.png",
    headerClass: "bg-[#e8f8ed]",
  },
  {
    id: "false",
    label: "ખોટું",
    icon: "/icons/incorrect.png",
    headerClass: "bg-[#f4d5d1]",
  },
];

/**
 * True / false cards — square split 50/50: tinted icon half, white label half.
 */
export function TrueFalseQuestion({ question, value, onChange, disabled, revealed }) {
  const selected = value ?? [];
  const options = OPTIONS.map((option) => {
    const custom = (question.options ?? []).find((item) => item.id === option.id);
    return custom ? { ...option, label: custom.label } : option;
  });

  return (
    <div className="mx-auto grid w-full max-w-[22rem] grid-cols-2 gap-3.5 sm:max-w-[24rem] sm:gap-4">
      {options.map((option) => {
        const isSelected = selected.includes(option.id);

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange([option.id])}
            aria-pressed={isSelected}
            className={cn(
              "grid aspect-[1/0.8] grid-rows-2 overflow-hidden rounded-[1.25rem] bg-white p-0 duration-200 ease-emphasized",
              !disabled && "active:scale-[0.98]",
              isSelected && "ring-[3px] ring-[#2d689d]",
              revealed && !isSelected && "opacity-55"
            )}
          >
            <span
              className={cn(
                "grid min-h-0 w-full place-items-center self-stretch",
                option.headerClass
              )}
            >
              <Image
                src={option.icon}
                alt=""
                width={216}
                height={216}
                className="pointer-events-none size-[46%] object-contain"
              />
            </span>
            <span className="grid min-h-0 place-items-center bg-white px-2 text-[1.02rem] text-[#111] sm:text-[1.08rem]">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
