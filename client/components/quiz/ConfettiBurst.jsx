"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const PIECES = [
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

/**
 * Burst around a correct-answer icon.
 *
 * Painted through a document.body portal so quiz sheets, buttons, and
 * overflow:hidden parents cannot clip the pieces.
 */
export function ConfettiBurst({ size = "md", className }) {
  const originRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const scale = size === "sm" ? 0.72 : 1;

  useLayoutEffect(() => {
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

  return (
    <>
      <span
        ref={originRef}
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", className)}
      />
      {origin
        ? createPortal(
            <div className="pointer-events-none fixed inset-0 z-[300]" aria-hidden>
              {PIECES.map((piece, index) => (
                <span
                  key={index}
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
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
