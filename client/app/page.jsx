"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { LANGUAGE_OPTIONS } from "@/config/languages";
import { ROUTES } from "@/config/routes";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language.store";

export default function LanguageSelectionPage() {
  const router = useRouter();
  const { t } = useI18n();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) return;
    setLanguage(selected);
    router.push(ROUTES.welcome);
  };

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F7F7F7]">
      <main className="mx-auto flex h-full w-full max-w-[26.5rem] flex-col bg-white px-4 pt-10 pb-8 md:max-w-none">
        <h1 className="text-center font-sans text-[24px] font-bold tracking-tight text-black">
          {t("selectLanguage")}
        </h1>

        <div className="mt-10 flex flex-1 flex-col gap-5">
          {LANGUAGE_OPTIONS.map((option) => {
            const active = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelected(option.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-6 rounded-[2rem] bg-gradient-to-r px-4 py-[-5px] text-left transition-transform active:scale-[0.99]",
                  option.cardClassName
                )}
              >
                {/* move text on left side */}
                <span className="ml-[-16px] grid size-25 shrink-0 place-items-center rounded-[1.75rem] text-[3.25rem] font-medium text-white shadow-sm">
                  <span
                    className={cn(
                      "grid size-full place-items-center rounded-[1.75rem]",
                      option.id === "gu" && "bg-[#4cb39a]",
                      option.id === "en" && "bg-[#c9952f]",
                      option.id === "hi" && "bg-[#726fbe]"
                    )}
                  >
                    {option.id === "gu" ? "ગા" : option.id === "en" ? "E" : "हिं"}
                  </span>
                </span>
                {/* move text on left side */}
                <span className="ml-[-10px] min-w-0">
                  <span className="block text-[20px] font-bold leading-none text-black">
                    {option.nativeLabel}
                  </span>
                  <span className="mt-3 block text-[16px] font-semibold leading-none text-black">
                    {option.englishLabel}
                  </span>
                </span>
                <span className="ml-auto grid size-14 shrink-0 place-items-center">
                  {active ? (
                    <span className="grid size-10 place-items-center rounded-full bg-black text-white">
                      <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
                        <path
                          d="M6 12.5 10 16.5 18 8.5"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center pt-8">
          <button
            type="button"
            onClick={handleNext}
            disabled={!selected}
            className="ease-emphasized relative inline-flex h-14 w-[70%] select-none items-center justify-center gap-2 rounded-full border-0 bg-[#2d689d] px-5 font-canva text-[1.05rem] font-bold text-white shadow-none outline-none transition-[transform,background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-0 hover:bg-[#255a88] active:scale-[0.97] disabled:pointer-events-none disabled:bg-[#e5ebf8] disabled:text-[#595858] disabled:opacity-100"
          >
            {t("next")}
          </button>
        </div>
      </main>
    </AppShell>
  );
}
