"use client";

import { Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";

/** Shared size / type for every primary CTA. */
const ACTION_BUTTON_GEOMETRY =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-full px-5 h-14 w-[70%] font-canva text-[1.05rem] font-bold transition-[transform,background-color,color] duration-200 ease-emphasized outline-none focus-visible:outline-none focus-visible:ring-0 active:scale-[0.97] disabled:pointer-events-none";

/**
 * Canonical primary CTA — Submit, Next, Send OTP, Home, certificate download.
 * Solid fill even when disabled (no opacity halo / soft blur behind the pill).
 */
export const ACTION_BUTTON_CLASS = cn(
  ACTION_BUTTON_GEOMETRY,
  "border-0 bg-[#2d689d] text-white shadow-none hover:bg-[#255a88] disabled:bg-[#2d689d] disabled:text-white/70 disabled:opacity-100"
);

/** Same geometry as the primary pill; white fill for the stacked second action. */
export const ACTION_BUTTON_SECONDARY_CLASS = cn(
  ACTION_BUTTON_GEOMETRY,
  "border-0 bg-white text-[#2d689d] shadow-none hover:bg-[#f7f9fb] disabled:bg-[#EEF2F6] disabled:text-[#9BB8D4] disabled:opacity-100"
);

export function ActionButtonRow({ className, children }) {
  return (
    <div className={cn("flex w-full justify-center", className)}>{children}</div>
  );
}

const VARIANT_CLASS = {
  filled:
    "border-0 bg-[#2d689d] text-white shadow-none hover:bg-[#255a88] disabled:bg-[#2d689d] disabled:text-white/70 disabled:opacity-100",
  tonal:
    "bg-primary-50 text-primary-800 shadow-none hover:bg-primary-100 disabled:bg-primary-50 disabled:text-primary-300 disabled:opacity-100",
  outline:
    "border-2 border-border bg-surface text-foreground shadow-none hover:bg-muted disabled:opacity-45",
  text: "bg-transparent text-primary-700 shadow-none hover:bg-primary-50 disabled:opacity-45",
  success: "bg-success text-white hover:brightness-95 disabled:opacity-45",
  saffron: "bg-saffron text-[#4a2600] hover:brightness-95 disabled:opacity-45",
};

/**
 * App CTA button. Defaults to the canonical primary pill (h-14, w-[70%], 1.05rem).
 * Pass `className={ACTION_BUTTON_CLASS}` explicitly where preferred — same result.
 */
export function AppButton({
  className,
  variant = "filled",
  size: _size,
  block = false,
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        ACTION_BUTTON_GEOMETRY,
        VARIANT_CLASS[variant] ?? VARIANT_CLASS.filled,
        block && "w-full max-w-none",
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
