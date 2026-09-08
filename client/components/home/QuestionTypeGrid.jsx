"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";

/** Question-type pills under the featured quiz — width follows the label. */
export function QuestionTypeGrid({ onSelect, wide = false }) {
  const { t } = useI18n();
  const types = [
    { id: "mcq", label: "MCQ", icon: BRAND_ICONS.queTypeMcq },
    { id: "blanks", label: t("fillBlanks"), Icon: BlanksIcon },
    { id: "match", label: t("matchThePair"), icon: BRAND_ICONS.queTypeMatch },
    { id: "truefalse", label: t("trueFalse"), icon: BRAND_ICONS.queTypeTrueFalse },
    { id: "sequence", label: t("sequence"), icon: BRAND_ICONS.queTypeSequence },
    { id: "image", label: t("imageQuestion"), icon: BRAND_ICONS.queTypeImage },
  ];
  return (
    <section className={wide ? "mt-8" : "mt-5"}>
      <h2
        className={
          wide
            ? "font-heading text-[1.35rem] font-bold text-[#111]"
            : "font-heading text-[1.15rem] font-bold text-[#111]"
        }
      >
        {t("questionTypes")}
      </h2>
      <div className={wide ? "mt-4 flex flex-wrap gap-3" : "mt-2.5 flex flex-wrap gap-2.5"}>
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect?.(type.id)}
            className={
              wide
                ? "inline-flex h-12 w-fit items-center gap-2.5 rounded-full border border-[#E6E8EC] bg-white px-5 transition-transform active:scale-[0.98]"
                : "inline-flex h-13 w-fit items-center gap-2.5 rounded-full bg-white px-5 shadow-[0_2px_0_#d9d9d9] transition-transform active:scale-[0.98]"
            }
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
