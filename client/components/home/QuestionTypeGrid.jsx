"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";

const TYPES = [
  { id: "mcq", label: "MCQ", icon: BRAND_ICONS.queTypeMcq },
  { id: "truefalse", label: "સાચું / ખોટું", Icon: TrueFalseIcon },
  { id: "blanks", label: "ખાલી જગ્યા પૂરો", Icon: BlanksIcon },
  { id: "match", label: "Match the pair", icon: BRAND_ICONS.queTypeMatch },
  { id: "sequence", label: "Sequence", icon: BRAND_ICONS.queTypeSequence },
];

/** Question-type pills under the featured quiz — width follows the label. */
export function QuestionTypeGrid({ onSelect }) {
  return (
    <section className="mt-5">
      <h2 className="font-heading text-[1.15rem] font-bold text-[#111]">Question types</h2>
      <div className="mt-2.5 flex flex-wrap gap-2.5">
        {TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect?.(type.id)}
            className="inline-flex h-13 w-fit items-center gap-2.5 rounded-full bg-white px-5 shadow-[0_2px_0_#d9d9d9] transition-transform active:scale-[0.98]"
          >
            {type.icon ? (
              <BrandIcon src={type.icon} alt="" className="size-5 shrink-0" />
            ) : (
              <type.Icon className="size-6 shrink-0" />
            )}
            <span className="whitespace-nowrap font-heading text-[16px] text-[#111]">
              {type.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TrueFalseIcon({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="11" cy="16" r="8" fill="#E6F4EA" />
      <path
        d="M7.6 16.2l2.2 2.2 4.6-5"
        fill="none"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="16" r="8" fill="#F8E6F0" />
      <path
        d="M20 13.5l5 5M25 13.5l-5 5"
        fill="none"
        stroke="#DC2626"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BlanksIcon({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M4 16.5h24"
        stroke="#111"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="7 5"
      />
    </svg>
  );
}
