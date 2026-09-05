"use client";

import { AppButton } from "@/components/common/AppButton";

const ICON_CONFETTI = [
  { className: "left-1 top-5 h-2.5 w-1 rounded-sm bg-[#FB7185] rotate-[-25deg]" },
  { className: "left-4 top-2 h-1.5 w-1.5 rounded-full bg-[#FACC15]" },
  { className: "left-7 top-10 h-2 w-2 rounded-full bg-[#60A5FA]" },
  { className: "right-3 top-3 h-2.5 w-1 rounded-sm bg-[#F97316] rotate-[28deg]" },
  { className: "right-0 top-9 h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" },
  { className: "right-6 top-12 h-2.5 w-1 rounded-sm bg-[#A78BFA] rotate-[-35deg]" },
  { className: "left-0 bottom-8 h-1.5 w-1.5 rounded-full bg-[#34D399]" },
  { className: "left-6 bottom-2 h-2.5 w-1 rounded-sm bg-[#FBBF24] rotate-[30deg]" },
  { className: "right-2 bottom-4 h-2 w-2 rounded-full bg-[#38BDF8]" },
  { className: "right-8 bottom-1 h-2.5 w-1 rounded-sm bg-[#EC4899] rotate-[-20deg]" },
];

/** Success state shown inside the auth screen before routing home. */
export function WelcomeStep({ name, onContinue }) {
  const firstName = String(name || "").trim().split(/\s+/)[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex items-end bg-black/10 backdrop-blur-[1.7px]"
    >
      <section className="animate-screen-in flex w-full min-h-[22rem] flex-col rounded-t-[3rem] bg-white px-6 pt-10 pb-6 text-center shadow-[0_-18px_48px_rgba(15,23,42,0.08)]">
        <div className="mt-auto">
          <div className="relative mx-auto grid size-28 place-items-center">
            {ICON_CONFETTI.map((piece) => (
              <span key={piece.className} aria-hidden className={`absolute ${piece.className}`} />
            ))}
            <div className="absolute inset-[0.35rem] rounded-full bg-[#E7FAEE]" />
            <div className="relative grid size-22 place-items-center rounded-full bg-[#22C55E] shadow-[0_10px_28px_rgba(34,197,94,0.24)]">
              <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
                <path
                  d="M15 25.5l6.3 6.3L34 19.2"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h2 className="mt-4 font-sans text-[24px] font-semibold leading-none text-[#111]">
            Successful!
          </h2>
          <p className="mt-6 px-2 text-[16px] leading-7 text-[#3F3F46]">
            {firstName
              ? `નમસ્તે ${firstName}, Your account is created successfully and ready now.`
              : "Your account is created successfully and ready now."}
          </p>
        </div>

        <div className="pt-10">
          <AppButton
            onClick={onContinue}
            className="h-16 w-[80%] rounded-full bg-black text-[18px] font-semibold text-white hover:bg-black/90"
          >
            Let's Start
          </AppButton>
        </div>
      </section>
    </div>
  );
}
