"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Boxed OTP field. A single hidden input owns the value and keyboard handling;
 * the boxes are presentational, which keeps paste, autofill and mobile keyboards
 * working correctly.
 */
export function OtpInput({ length = 6, value, onChange, onComplete, invalid, autoFocus }) {
  const inputRef = useRef(null);
  const digits = String(value ?? "").slice(0, length).split("");

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleChange = (event) => {
    const next = event.target.value.replace(/\D/g, "").slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <div
      className={cn("relative", invalid && "animate-shake")}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        value={value ?? ""}
        onChange={handleChange}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        aria-label="OTP"
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <div className="flex justify-between gap-1.5">
        {Array.from({ length }).map((_, index) => {
          const filled = Boolean(digits[index]);
          const isNext = index === digits.length;
          return (
            <div
              key={index}
              className={cn(
                "grid h-14 min-w-0 flex-1 place-items-center rounded-lg border bg-white font-heading text-xl font-semibold transition-all duration-200",
                invalid
                  ? "border-error text-error"
                  : filled
                    ? "border-primary-600 text-foreground"
                    : "border-[#D5DCE3] text-muted-foreground",
                isNext && !invalid && "border-primary-500 ring-4 ring-primary-100"
              )}
            >
              {filled ? digits[index] : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
