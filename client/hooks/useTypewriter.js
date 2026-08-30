"use client";

import { useEffect, useState } from "react";

/**
 * Reveals `text` a few characters at a time, so it reads like the AI is
 * writing it live instead of appearing all at once. Restarts whenever `text`
 * changes and freezes at full length when `enabled` is false.
 */
export function useTypewriter(text, { enabled = true, charsPerTick = 2, intervalMs = 20 } = {}) {
  const full = text ?? "";
  const [length, setLength] = useState(enabled ? 0 : full.length);

  useEffect(() => {
    const reset = (value) => setLength(value);
    if (!enabled || !full) {
      reset(full.length);
      return undefined;
    }
    reset(0);
    const id = setInterval(() => {
      setLength((current) => {
        const next = current + charsPerTick;
        if (next >= full.length) {
          clearInterval(id);
          return full.length;
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, enabled]);

  return { text: full.slice(0, length), done: length >= full.length };
}
