"use client";

import { useSearchParams } from "next/navigation";

/** True when the quiz/result was opened as Practice (no login required). */
export function usePracticeMode() {
  const searchParams = useSearchParams();
  return searchParams.get("practice") === "1";
}
