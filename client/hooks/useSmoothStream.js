"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Steady typewriter: smooth, but not sluggish. */
const TICK_MS = 14;
const BASE_CHARS = 2;
const MAX_CHARS = 5;

/**
 * Smooth typewriter reveal for streamed tokens.
 * Network chunks land in a buffer; a timer drains them slowly so the UI
 * never dumps a large SSE burst in one paint.
 */
export function useSmoothStream(onUpdate) {
  const bufferRef = useRef("");
  const shownRef = useRef("");
  const timerRef = useRef(0);
  const onUpdateRef = useRef(onUpdate);
  const drainResolversRef = useRef([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const resolveDrain = useCallback(() => {
    const resolvers = drainResolversRef.current;
    drainResolversRef.current = [];
    for (const resolve of resolvers) resolve(shownRef.current);
  }, []);

  const stopPump = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
  }, []);

  const pump = useCallback(() => {
    timerRef.current = 0;
    const pending = bufferRef.current;
    if (!pending) {
      setBusy(false);
      resolveDrain();
      return;
    }

    // Keep reveal pace smooth; catch up a bit when the buffer is backing up.
    const step = Math.min(
      pending.length,
      pending.length > 80 ? MAX_CHARS : pending.length > 24 ? 3 : BASE_CHARS
    );
    const take = pending.slice(0, step);
    bufferRef.current = pending.slice(step);
    shownRef.current += take;
    onUpdateRef.current?.(shownRef.current);

    if (bufferRef.current) {
      timerRef.current = window.setTimeout(pump, TICK_MS);
    } else {
      setBusy(false);
      resolveDrain();
    }
  }, [resolveDrain]);

  const ensurePump = useCallback(() => {
    if (timerRef.current) return;
    setBusy(true);
    timerRef.current = window.setTimeout(pump, TICK_MS);
  }, [pump]);

  const push = useCallback(
    (chunk) => {
      if (!chunk) return;
      bufferRef.current += chunk;
      ensurePump();
    },
    [ensurePump]
  );

  const reset = useCallback(() => {
    stopPump();
    bufferRef.current = "";
    shownRef.current = "";
    resolveDrain();
    setBusy(false);
  }, [resolveDrain, stopPump]);

  /** Wait until the typewriter has finished revealing (no sudden dump). */
  const drain = useCallback(() => {
    if (!bufferRef.current && !timerRef.current) {
      return Promise.resolve(shownRef.current);
    }
    return new Promise((resolve) => {
      drainResolversRef.current.push(resolve);
      ensurePump();
    });
  }, [ensurePump]);

  /** @deprecated Prefer `drain` — kept so callers that flush stay compatible. */
  const flush = useCallback(() => drain(), [drain]);

  useEffect(() => () => stopPump(), [stopPump]);

  return { push, reset, flush, drain, busy, getShown: () => shownRef.current };
}
