"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const BURST = [
  { dx: -72, dy: -88, rot: -90, color: "#EC4899", w: 10, h: 16, radius: 2, delay: 0 },
  { dx: 76, dy: -82, rot: 110, color: "#FACC15", w: 9, h: 15, radius: 2, delay: 40 },
  { dx: -22, dy: -108, rot: 40, color: "#60A5FA", w: 11, h: 11, radius: 999, delay: 70 },
  { dx: 28, dy: -110, rot: -50, color: "#A78BFA", w: 10, h: 10, radius: 999, delay: 50 },
  { dx: -98, dy: -18, rot: -30, color: "#F472B6", w: 13, h: 7, radius: 2, delay: 90 },
  { dx: 102, dy: -12, rot: 25, color: "#34D399", w: 13, h: 7, radius: 2, delay: 110 },
  { dx: -82, dy: 52, rot: 70, color: "#818CF8", w: 9, h: 14, radius: 2, delay: 120 },
  { dx: 86, dy: 48, rot: -75, color: "#FB7185", w: 9, h: 14, radius: 2, delay: 130 },
  { dx: -12, dy: 96, rot: 15, color: "#FDE047", w: 10, h: 10, radius: 999, delay: 140 },
  { dx: 16, dy: 100, rot: -20, color: "#C084FC", w: 8, h: 13, radius: 2, delay: 60 },
  { dx: -116, dy: -56, rot: 130, color: "#38BDF8", w: 7, h: 16, radius: 999, delay: 20 },
  { dx: 118, dy: -52, rot: -140, color: "#F9A8D4", w: 7, h: 16, radius: 999, delay: 35 },
  { dx: -54, dy: 84, rot: 95, color: "#4ADE80", w: 11, h: 8, radius: 2, delay: 80 },
  { dx: 58, dy: 88, rot: -100, color: "#FBBF24", w: 11, h: 8, radius: 2, delay: 100 },
  { dx: -40, dy: -70, rot: 55, color: "#FB923C", w: 8, h: 12, radius: 2, delay: 15 },
  { dx: 44, dy: -66, rot: -60, color: "#2DD4BF", w: 8, h: 12, radius: 2, delay: 85 },
];

const COLORS = [
  "#EC4899",
  "#FACC15",
  "#60A5FA",
  "#A78BFA",
  "#34D399",
  "#FB7185",
  "#F97316",
  "#2DD4BF",
  "#F472B6",
  "#38BDF8",
];

function makeRain(count) {
  return Array.from({ length: count }, (_, i) => {
    const n = (step) => {
      const v = (i * 9301 + 49297 * (step + 1)) % 233280;
      return v / 233280;
    };
    return {
      left: n(1) * 100,
      delay: n(2) * 420,
      duration: 1700 + n(3) * 1100,
      color: COLORS[i % COLORS.length],
      w: 6 + n(4) * 8,
      h: 9 + n(5) * 11,
      drift: (n(6) - 0.5) * 96,
      rot: 200 + n(7) * 320,
      radius: n(8) > 0.45 ? 2 : 999,
    };
  });
}

/**
 * Celebration on a correct answer.
 *
 * `celebrate` rains confetti from the top of the screen. A smaller burst
 * still pops from the verdict icon. Painted through a document.body portal
 * so quiz sheets cannot clip the pieces.
 */
export function ConfettiBurst({ size = "md", className, celebrate = false }) {
  const originRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [mounted, setMounted] = useState(false);
  const scale = size === "sm" ? 0.72 : 1;
  const rain = useMemo(() => (celebrate ? makeRain(64) : []), [celebrate]);

  useLayoutEffect(() => {
    setMounted(true);
    const node = originRef.current;
    if (!node) return undefined;

    const place = () => {
      const box = node.getBoundingClientRect();
      setOrigin({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    };

    place();
    const raf = requestAnimationFrame(place);
    const retry = window.setTimeout(place, 120);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(retry);
      window.removeEventListener("resize", place);
    };
  }, []);

  const layer =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[300] overflow-hidden" aria-hidden>
            {celebrate
              ? rain.map((piece, index) => (
                  <span
                    key={`rain-${index}`}
                    className="animate-confetti-fall absolute"
                    style={{
                      left: `${piece.left}%`,
                      top: "-16px",
                      "--drift": `${piece.drift}px`,
                      "--spin": `${piece.rot}deg`,
                      width: piece.w,
                      height: piece.h,
                      borderRadius: piece.radius,
                      background: piece.color,
                      animationDelay: `${piece.delay}ms`,
                      animationDuration: `${piece.duration}ms`,
                    }}
                  />
                ))
              : null}
            {origin
              ? BURST.map((piece, index) => (
                  <span
                    key={`burst-${index}`}
                    className="animate-confetti absolute"
                    style={{
                      left: origin.x,
                      top: origin.y,
                      "--dx": `${piece.dx * scale}px`,
                      "--dy": `${piece.dy * scale}px`,
                      "--rot": `${piece.rot}deg`,
                      width: Math.max(5, piece.w * scale),
                      height: Math.max(5, piece.h * scale),
                      borderRadius: piece.radius,
                      background: piece.color,
                      animationDelay: `${piece.delay}ms`,
                    }}
                  />
                ))
              : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={originRef}
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", className)}
      />
      {layer}
    </>
  );
}
