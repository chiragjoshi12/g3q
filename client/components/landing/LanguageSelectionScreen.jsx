"use client";

import { useState } from "react";

import { AUTH_BUTTON_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { AppShell } from "@/components/layout/AppShell";
import { LANGUAGE_OPTIONS } from "@/config/languages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language.store";

const SELECT_BG = "/language/select-bg.png";

export function LanguageSelectionScreen() {
  const { t } = useI18n();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (!selected) return;
    setLanguage(selected);
  };

  return (
    <AppShell
      fullOnDesktop
      className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F7F7F7] lg:bg-transparent"
    >
      <main className="mx-auto flex h-full w-full max-w-[26.5rem] flex-col bg-white px-4 pt-10 pb-8 md:max-w-none lg:hidden">
        <h1 className="mt-1 text-center text-[22px] font-bold tracking-tight text-black">
          {t("selectLanguage")}
        </h1>
        <p className="mt-1 text-center text-[18px] font-medium tracking-tight text-black">
          ભાષા પસંદ કરો
        </p>

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
                  "flex items-center gap-7 rounded-[2rem] bg-gradient-to-r px-4 py-[-5px] text-left transition-transform active:scale-[0.99]",
                  option.cardGradient
                )}
              >
                <span className="ml-[-16px] grid h-23 w-23 shrink-0 place-items-center rounded-[1.75rem] text-[32px] font-medium text-white">
                  <span
                    className={cn(
                      "grid size-full place-items-center rounded-[1.5rem]",
                      option.iconBg
                    )}
                  >
                    {option.glyph}
                  </span>
                </span>
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
                    <span className="grid size-8 place-items-center rounded-full bg-black text-white">
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

      <div className="relative hidden h-full min-h-0 w-full items-center justify-center overflow-hidden lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 scale-110 bg-[#f3efe6] bg-cover bg-center bg-no-repeat blur-[5px]"
          style={{ backgroundImage: `url('${SELECT_BG}')` }}
        />

        <div className="relative z-10 flex min-h-[30rem] w-[min(42rem,86vw)] flex-col rounded-[1.85rem] bg-white px-10 pt-6 pb-9">
          <h1 className="text-center font-sans text-[1.65rem] font-bold tracking-tight text-black">
            Select Language / भाषा चुनें
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {LANGUAGE_OPTIONS.map((option) => {
              const active = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelected(option.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-[6.25rem] overflow-hidden rounded-[1.15rem] text-left transition-transform active:scale-[0.99]",
                    option.panelBg,
                    active ? "border border-[2.5px] border-[#2d689d]" : "ring-0"
                  )}
                >
                  <span
                    className={cn(
                      "grid w-[5.5rem] shrink-0 place-items-center self-stretch text-[2.15rem] font-medium text-white",
                      option.iconBg
                    )}
                  >
                    {option.glyph}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4">
                    <span className="block text-[1.2rem] font-bold leading-tight text-black">
                      {option.nativeLabel}
                    </span>
                    <span className="mt-2 block text-[0.95rem] font-medium leading-tight text-black">
                      {option.englishLabel}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto flex justify-center pt-10">
            <AppButton
              onClick={handleNext}
              disabled={!selected}
              className={cn(AUTH_BUTTON_CLASS, "!w-[16rem]")}
            >
              {t("next")}
            </AppButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
