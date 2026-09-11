"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { getRoleTabs } from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** New-user signup: pick school / college / citizen. */
export function CategoryStep({ onSelect }) {
  const { t } = useI18n();
  const roleTabs = getRoleTabs();

  return (
    <div className="animate-screen-in space-y-6">
      <p className="text-[15px] leading-relaxed text-[#111]">{t("chooseStudyType")}</p>

      <div role="list" aria-label={t("register")} className="grid grid-cols-3 gap-2.5">
        {roleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex min-h-[9.5rem] flex-col items-center justify-center gap-4 rounded-[1.35rem] bg-white px-1.5 py-3 shadow-[0_0_0_1px_#EFEFEF] transition-transform active:scale-[0.98]"
            )}
          >
            <BrandIcon src={item.icon} alt="" className="h-[4.85rem] w-auto max-w-full" />
            <span className="text-center text-[14px] leading-tight text-[#111]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
