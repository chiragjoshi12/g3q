"use client";

import Image from "next/image";

import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { LineArrowRight } from "@/components/icons";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = BRAND_ICONS.profilePhoto;

function Avatar({ name, avatar, className }) {
  const src = avatar || DEFAULT_AVATAR;
  const initial = name?.trim()?.[0] ?? "?";

  return (
    <span
      className={cn(
        "relative size-[3.15rem] shrink-0 overflow-hidden rounded-full bg-[#DCE6F0]",
        className
      )}
    >
      {src ? (
        <Image src={src} alt="" fill sizes="52px" className="object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-base font-bold text-[#2d689d]">
          {initial}
        </span>
      )}
    </span>
  );
}

/** Gold score with Rank Stars artwork (matches Canva). */
export function LeaderboardScoreBadge({ score }) {
  return (
    <div className="relative h-[3.85rem] w-[3.7rem] shrink-0">
      <span className="absolute inset-x-0 top-1 z-[1] text-center text-[1.22rem] font-bold leading-none tracking-tight text-[#D4A017]">
        {score}
      </span>
      <BrandIcon
        src={BRAND_ICONS.rankStars}
        alt=""
        className="pointer-events-none absolute inset-0 size-full -translate-y-2"
      />
    </div>
  );
}

export function LeaderboardDetailRow({
  rank,
  name,
  institute,
  grade,
  score,
  avatar,
  you = false,
}) {
  return (
    <li className="flex items-start gap-3 px-1 py-3.5">
      <div className="-ml-2 flex min-w-0 flex-1 items-start gap-3">
        <div className="flex shrink-0 items-center gap-3">
          <span className="w-6 text-center text-[1.05rem] leading-none text-[#1F2937]">
            {rank}
          </span>
          <Avatar name={name} avatar={avatar} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.98rem] font-bold leading-snug text-[#2d689d]">
            {you ? `${name} (You)` : name}
          </p>
          {institute ? (
            <p className="mt-0.5 truncate text-[12px] leading-snug text-[#000000]">{institute}</p>
          ) : null}
          {grade ? (
            <span className="mt-1.5 inline-block rounded-full bg-[#e5ebf8] px-3.5 py-1 text-[11px] font-medium text-[#000000]">
              {grade}
            </span>
          ) : null}
        </div>
      </div>
      {score != null ? <LeaderboardScoreBadge score={score} /> : null}
    </li>
  );
}

export function LeaderboardCategoryTabs({ value, onChange }) {
  const items = [
    { id: "school", label: "સ્કૂલ" },
    { id: "college", label: "કોલેજ" },
    { id: "citizen", label: "નાગરિક" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Leaderboard category"
      className="flex w-full items-end justify-center gap-x-20 px-1"
    >
      {items.map((item) => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative pb-2 text-[1.05rem] leading-none",
              active ? "font-bold text-[#2d689d]" : "font-normal text-black"
            )}
          >
            {item.label}
            {active ? (
              <span
                aria-hidden
                className="absolute left-[-8px] right-[-8px] bottom-0 h-[1.8px] rounded-full bg-[#2d689d]"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function LeaderboardPreviewCard({ talukaLabel, week, onClick, iconColor = "#2d689d", className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[5.75rem] w-full items-start gap-4 rounded-[2rem] bg-white px-6 pt-5 pb-5 active:bg-[#fafafa]",
        className
      )}
    >
      <BrandGlyph
        src={BRAND_ICONS.leaderboard}
        color={iconColor}
        className="size-9 shrink-0"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[1.35rem] font-bold leading-tight" style={{ color: iconColor }}>
          લીડરબોર્ડ
        </p>
        <p className="mt-1 truncate text-[15px] leading-snug text-black">
          {talukaLabel} તાલુકો - {week} મું અઠવાડિયું
        </p>
      </div>
      <LineArrowRight className="size-5 shrink-0 text-black" />
    </button>
  );
}

export function PodiumIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3.5 13.1 6.2 16 6.6 13.9 8.6 14.5 11.4 12 10 9.5 11.4 10.1 8.6 8 6.6 10.9 6.2 12 3.5Z" />
      <path d="M5 20v-5.5h4.5V20" />
      <path d="M9.5 20V9.5H14.5V20" />
      <path d="M14.5 20v-3.5H19V20" />
      <path d="M4 20h16" />
    </svg>
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
      <span className="text-2xl leading-none font-bold tracking-tighter text-[#111]">:</span>
    </li>
  );
}

export function BoardToggle({ value, onChange }) {
  const items = [
    { id: "school", label: "School" },
    { id: "college", label: "College" },
    { id: "citizen", label: "People" },
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
