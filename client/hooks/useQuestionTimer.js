"use client";

import { useEffect, useState } from "react";

import { appConfig } from "@/config/app.config";
import { useQuizStore } from "@/store/quiz.store";

/**
 * Ticking read of the current question's elapsed time.
 *
 * The value is pulled imperatively from the store rather than selected, because
 * a time-dependent selector would produce a new snapshot on every read and
 * loop useSyncExternalStore.
 */
export function useQuestionTimer({ running, questionId }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const read = () => setElapsedMs(useQuizStore.getState().readElapsedMs());
    read();
    if (!running) return undefined;
    const id = setInterval(read, appConfig.quiz.tickMs);
    return () => clearInterval(id);
  }, [running, questionId]);

  return elapsedMs;
}
