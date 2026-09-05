"use client";

/** Brief pause after OTP / profile so login success is visible before Home. */
export function WelcomeStep({ name }) {
  const firstName = String(name || "").trim().split(/\s+/)[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-screen-in flex min-h-[28rem] flex-col items-center justify-center text-center"
    >
      <div className="relative grid size-[6.25rem] place-items-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full bg-[#E8F8ED]" />
        <span className="animate-verdict-pop relative grid size-[5.25rem] place-items-center rounded-full bg-[#E8F8ED]">
          <svg viewBox="0 0 48 48" className="size-12" aria-hidden>
            <circle cx="24" cy="24" r="20" fill="none" stroke="#16A34A" strokeWidth="2.5" />
            <path
              d="M14.5 24.5l6.5 6.5 13-14"
              fill="none"
              stroke="#16A34A"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <h2 className="mt-8 text-[1.45rem] font-bold text-[#111]">લોગિન સફળ થયું</h2>
      {firstName ? (
        <p className="mt-2.5 text-[1.05rem] text-[#444]">નમસ્તે, {firstName}</p>
      ) : null}
      <p className="mt-2 text-[13px] text-[#8A8A8A]">Home પર જઈ રહ્યા છીએ…</p>
    </div>
  );
}
