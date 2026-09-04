"use client";

import { useEffect, useState } from "react";

const formatEnIn = new Intl.NumberFormat("en-IN");

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Counts from `start` up to `target` on mount / when the target changes.
 * Skips the animation when the user prefers reduced motion.
 */
export function useCountUp(target, { durationMs = 1400, start = 0 } = {}) {
  const end = Number(target) || 0;
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(end);
      return undefined;
    }

    let frame;
    const from = start;
    const t0 = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - t0) / durationMs);
      setValue(Math.round(from + (end - from) * easeOutCubic(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    setValue(from);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, durationMs, start]);

  return formatEnIn.format(value);
}
