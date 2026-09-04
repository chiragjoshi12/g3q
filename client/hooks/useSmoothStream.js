"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Smooth typewriter reveal for streamed tokens.
 * Network chunks land in a buffer; rAF drains them at a steady cadence.
 */
export function useSmoothStream(onUpdate) {
  const bufferRef = useRef("");
  const shownRef = useRef("");
  const rafRef = useRef(0);
  const onUpdateRef = useRef(onUpdate);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const stopPump = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const pump = useCallback(() => {
    rafRef.current = 0;
    const pending = bufferRef.current;
    if (!pending) {
      setBusy(false);
      return;
    }

    // Reveal a few characters per frame for smooth streaming.
    const step = Math.min(pending.length, pending.length > 48 ? 6 : pending.length > 16 ? 3 : 2);
    const take = pending.slice(0, step);
    bufferRef.current = pending.slice(step);
    shownRef.current += take;
    onUpdateRef.current?.(shownRef.current);

    if (bufferRef.current) {
      rafRef.current = requestAnimationFrame(pump);
    } else {
      setBusy(false);
    }
  }, []);

  const push = useCallback(
    (chunk) => {
      if (!chunk) return;
      bufferRef.current += chunk;
      setBusy(true);
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(pump);
      }
    },
    [pump]
  );

  const reset = useCallback(() => {
    stopPump();
    bufferRef.current = "";
    shownRef.current = "";
    setBusy(false);
  }, [stopPump]);

  const flush = useCallback(() => {
    stopPump();
    if (bufferRef.current) {
      shownRef.current += bufferRef.current;
      bufferRef.current = "";
      onUpdateRef.current?.(shownRef.current);
    }
    setBusy(false);
    return shownRef.current;
  }, [stopPump]);

  useEffect(() => () => stopPump(), [stopPump]);

  return { push, reset, flush, busy, getShown: () => shownRef.current };
}
