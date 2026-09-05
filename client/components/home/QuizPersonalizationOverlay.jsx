"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-screen "AI is personalising your quiz" scene shown after Play Quiz.
 *
 * Everything is drawn with SVG/CSS (no static hero image) so the robot floats,
 * data lines flow into it, and signal chips check off one-by-one while a live
 * progress bar fills — selling the idea that questions are being tailored.
 */

const DURATION_OPTIONS_MS = [7000, 8000, 9000];

/** Signal chips that light up around the robot, in reveal order. */
const SIGNALS = [
  {
    id: "interests",
    label: "તમારી રુચિ",
    corner: "Your Interests",
    accent: "#7C5CE0",
    tint: "#EEE9FB",
    at: { x: 20, y: 30 },
    from: { x: 158, y: 150 },
    icon: FlaskIcon,
  },
  {
    id: "level",
    label: "તમારું લેવલ",
    corner: "Your Level",
    accent: "#16A34A",
    tint: "#E4F6EA",
    at: { x: 19, y: 66 },
    from: { x: 152, y: 168 },
    icon: LeafIcon,
  },
  {
    id: "goals",
    label: "તમારા લક્ષ્યો",
    corner: "Your Goals",
    accent: "#E5484D",
    tint: "#FCE7E8",
    at: { x: 80, y: 30 },
    from: { x: 242, y: 150 },
    icon: PiIcon,
  },
  {
    id: "style",
    label: "શીખવાની રીત",
    corner: "Your Learning Style",
    accent: "#2D689D",
    tint: "#E4EEF7",
    at: { x: 81, y: 66 },
    from: { x: 248, y: 168 },
    icon: GlobeIcon,
  },
];

const SPARKLES = [
  { x: 12, y: 18, d: 0 },
  { x: 88, y: 14, d: 0.4 },
  { x: 6, y: 54, d: 0.8 },
  { x: 94, y: 58, d: 0.3 },
  { x: 50, y: 8, d: 0.6 },
  { x: 30, y: 72, d: 1 },
  { x: 70, y: 76, d: 0.5 },
];

export function QuizPersonalizationOverlay({ name, taluka, onComplete }) {
  const firstName = String(name || "").trim().split(/\s+/)[0];
  const [revealed, setRevealed] = useState(0);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);
  const totalMsRef = useRef(
    DURATION_OPTIONS_MS[Math.floor(Math.random() * DURATION_OPTIONS_MS.length)]
  );

  useEffect(() => {
    const totalMs = totalMsRef.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setRevealed(SIGNALS.length);
      setProgress(100);
      const t = window.setTimeout(() => onComplete?.(), 900);
      return () => window.clearTimeout(t);
    }

    // Chips check off across the run.
    const chipTimers = SIGNALS.map((_, index) =>
      window.setTimeout(
        () => setRevealed(index + 1),
        600 + index * ((totalMs - 1100) / SIGNALS.length)
      )
    );

    // Progress via interval (keeps advancing even if the tab is backgrounded,
    // unlike requestAnimationFrame). Eased so it lingers near the end.
    const start = Date.now();
    const progressTimer = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / totalMs);
      setProgress(Math.round(t * 100));
    }, 50);

    const doneTimer = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      window.clearInterval(progressTimer);
      setProgress(100);
      setRevealed(SIGNALS.length);
      window.setTimeout(() => onComplete?.(), 250);
    }, totalMs);

    return () => {
      chipTimers.forEach(window.clearTimeout);
      window.clearInterval(progressTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI તમારી ક્વિઝ તૈયાર કરી રહ્યું છે"
      className="fixed inset-0 z-[100] flex flex-col items-center overflow-hidden px-6"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/g3q-ai-bg.jpeg')" }}
      />

      {/* ambient blobs */}
      <div
        aria-hidden
        className="animate-ai-scene-glow absolute -top-28 -right-24 size-80 rounded-full bg-[#9cc0e8]/40 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-ai-scene-glow absolute -bottom-28 -left-24 size-80 rounded-full bg-[#cdb8f2]/40 blur-3xl"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative flex w-full max-w-[26rem] flex-1 flex-col items-center justify-center">
      <div className="relative w-full">
      <h2 className="mt-2 -translate-y-16 py-1 text-[1.35rem] leading-tight font-bold bg-gradient-to-r from-[#7C5CE0] via-[#2D689D] to-[#61A5D8] bg-clip-text text-transparent">
            {firstName ? `${firstName}, ` : ""} તમારા માટે પર્સનલાઈઝ્ડ પ્રશ્નો બની રહ્યા છે...
          </h2>
        </div>

        <div className="relative aspect-[4/3] w-full scale-[0.9]">
          <svg
            viewBox="0 0 400 300"
            className="absolute inset-0 h-full w-full"
            fill="none"
            aria-hidden
          >
            {SIGNALS.map((sig, index) => {
              const active = revealed > index;
              const to = { x: (sig.at.x / 100) * 400 + 46, y: (sig.at.y / 100) * 300 + 26 };
              const mid = { x: (sig.from.x + to.x) / 2, y: Math.min(sig.from.y, to.y) - 12 };
              const d = `M ${sig.from.x} ${sig.from.y} Q ${mid.x} ${mid.y} ${to.x} ${to.y}`;
              return (
                <path
                  key={sig.id}
                  d={d}
                  stroke={sig.accent}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="5 6"
                  className="transition-opacity duration-500"
                  style={{
                    opacity: active ? 0.55 : 0.12,
                    animation: active
                      ? "ai-scene-flow 0.9s linear infinite"
                      : "none",
                  }}
                />
              );
            })}
          </svg>

          {/* robot */}
          <div className="animate-ai-scene-float absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <RobotMark />
          </div>

          {/* signal chips */}
          {SIGNALS.map((sig, index) => {
            const active = revealed > index;
            return (
              <SignalChip
                key={sig.id}
                signal={sig}
                active={active}
                delayMs={index * 60}
              />
            );
          })}

          {/* sparkles */}
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute text-[#c9a9f0]"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                animation: `ai-scene-twinkle 2.2s ease-in-out ${s.d}s infinite`,
              }}
            >
              <Sparkle />
            </span>
          ))}
        </div>
        <div className="mt-5 w-full max-w-[20rem]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-heading text-[13px] font-semibold text-[#526273]">
            </span>
            <span className="font-heading text-[1.5rem] leading-none font-bold tabular-nums text-[#2D689D]">
              {progress}
              <span className="ml-0.5 text-[0.85rem] font-bold text-[#7C5CE0]">%</span>
            </span>
          </div>
          <div className="relative h-4.5 overflow-hidden rounded-full bg-white/80 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C5CE0] via-[#2D689D] to-[#61A5D8] transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            >
              <span className="animate-ai-scene-sheen absolute inset-y-0 left-0 block w-12 skew-x-[-18deg] bg-white/45" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalChip({ signal, active, delayMs }) {
  const Icon = signal.icon;
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${signal.at.x}%`, top: `${signal.at.y}%` }}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border border-white bg-white px-2.5 py-2 shadow-[0_12px_28px_rgb(45_104_157/0.22)] transition-all duration-500"
        style={{
          opacity: active ? 1 : 0.3,
          transform: active ? "translateY(0) scale(1)" : "translateY(6px) scale(0.9)",
          boxShadow: active
            ? `0 12px 28px ${signal.accent}33`
            : "0 6px 16px rgb(45 104 157 / 0.12)",
          animation: active
            ? `ai-scene-chip-in 0.5s cubic-bezier(0.2,0,0,1) ${delayMs}ms both`
            : "none",
        }}
      >
        <span
          className="grid size-7 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: signal.tint, color: signal.accent }}
        >
          <Icon />
        </span>
        <span className="flex flex-col gap-1">
          <span
            className="block h-1.5 w-9 rounded-full"
            style={{ backgroundColor: `${signal.accent}59` }}
          />
          <span
            className="block h-1.5 w-6 rounded-full"
            style={{ backgroundColor: "#D8DEE6" }}
          />
        </span>
        <span
          className="grid size-5 shrink-0 place-items-center rounded-full text-white"
          style={{
            backgroundColor: active ? signal.accent : "#CBD3DD",
            transform: active ? "scale(1)" : "scale(0.6)",
            opacity: active ? 1 : 0.5,
            transition: "all 0.35s cubic-bezier(0.2,0,0,1)",
            animation: active
              ? `ai-scene-check-pop 0.4s cubic-bezier(0.2,0,0,1) ${delayMs + 180}ms both`
              : "none",
          }}
        >
          <CheckIcon />
        </span>
      </div>
    </div>
  );
}

/* --- SVG marks --- */

function RobotMark() {
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" fill="none">
      <defs>
        <linearGradient id="ai-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e8eefc" />
        </linearGradient>
        <radialGradient id="ai-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#8fb6ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8fb6ff" stopOpacity="0" />
        </radialGradient>
        <filter id="ai-eye-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* halo */}
      <circle cx="66" cy="66" r="60" fill="url(#ai-halo)" className="animate-ai-scene-glow" />

      {/* antenna */}
      <line x1="66" y1="24" x2="66" y2="14" stroke="#9fb4d6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="66" cy="11" r="4.5" fill="#7C5CE0" className="animate-ai-scene-glow" />

      {/* ears */}
      <rect x="26" y="52" width="8" height="20" rx="4" fill="#dbe3f4" />
      <rect x="98" y="52" width="8" height="20" rx="4" fill="#dbe3f4" />

      {/* head */}
      <rect x="32" y="26" width="68" height="58" rx="24" fill="url(#ai-head)" stroke="#d3ddef" strokeWidth="2" />

      {/* visor */}
      <rect x="41" y="38" width="50" height="34" rx="16" fill="#122A47" />

      {/* smiling eyes */}
      <g filter="url(#ai-eye-glow)" stroke="#8fd3ff" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M52 52 q4 6 8 0" style={{ transformOrigin: "56px 54px", animation: "ai-scene-eye 3.6s ease-in-out infinite" }} />
        <path d="M72 52 q4 6 8 0" style={{ transformOrigin: "76px 54px", animation: "ai-scene-eye 3.6s ease-in-out infinite" }} />
      </g>

      {/* cheeks */}
      <circle cx="48" cy="63" r="2.2" fill="#8fd3ff" opacity="0.6" />
      <circle cx="84" cy="63" r="2.2" fill="#8fd3ff" opacity="0.6" />

      {/* body hint */}
      <path
        d="M44 86 q22 14 44 0 v9 q-22 13 -44 0 z"
        fill="#eef2fb"
        stroke="#d7dff0"
        strokeWidth="2"
      />
      <circle cx="66" cy="93" r="3" fill="#7C5CE0" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 0c.5 3.4 2.6 5.5 6 7-3.4 1.5-5.5 3.6-6 7-.5-3.4-2.6-5.5-6-7 3.4-1.5 5.5-3.6 6-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v6l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3" />
      <path d="M7 15h10" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13c0-6 8-9 16-9 0 8-3 16-9 16Z" />
      <path d="M6 21c3-6 6-8 12-9" />
    </svg>
  );
}

function PiIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14" />
      <path d="M9 7v11" />
      <path d="M16 7v9a2 2 0 0 0 2 2" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  );
}
