"use client";

import { cn } from "@/lib/utils";

function Avatar({ name, className }) {
  const initial = name?.trim()?.[0] ?? "?";
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full bg-primary-600 text-base font-bold text-white md:size-12",
        className
      )}
    >
      {initial}
    </span>
  );
}

export function LeaderboardRow({ rank, name, institute, grade, you = false }) {
  return (
    <li className="flex items-start py-3 md:py-3.5">
      <span className="w-8 shrink-0 pt-2 text-center text-lg font-bold text-[#111] md:w-9 md:text-xl">
        {rank}
      </span>
      <Avatar name={name} className="ml-8 md:ml-10" />
      <span className="ml-3 min-w-0 flex-1 md:ml-4">
        <span className="block text-[1.05rem] font-bold text-[#111] md:text-lg">
          {you ? `${name} (You)` : name}
        </span>
        {institute ? (
          <span className="mt-0.5 block text-sm leading-snug text-[#374151] md:text-[15px]">
            {institute}
          </span>
        ) : null}
        {grade ? (
          <span className="mt-0.5 block text-sm text-[#374151] md:text-[15px]">{grade}</span>
        ) : null}
      </span>
    </li>
  );
}

export function LeaderboardGap() {
  return (
    <li aria-hidden className="flex justify-center py-1">
      <span className="text-2xl leading-none font-bold tracking-tighter text-[#111]">
        :
      </span>
    </li>
  );
}

export function BoardToggle({ value, onChange }) {
  const items = [
    { id: "school", label: "સ્કૂલ" },
    { id: "college", label: "કોલેજ" },
  ];

  return (
    <div className="mx-auto flex w-[75%] rounded-[1.2rem] border border-[#D5DCE3] bg-white p-[3px]">
      {items.map((item) => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex-1 rounded-[1.2rem] py-3 text-center text-[15px] transition-colors md:py-4 md:text-base",
              active
                ? "bg-[#2d689d] font-bold text-white"
                : "bg-transparent font-normal text-[#111]"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}