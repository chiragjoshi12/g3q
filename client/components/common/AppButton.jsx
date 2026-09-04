"use client";

import { Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";

/** Shared size / type for every primary CTA. */
const ACTION_BUTTON_GEOMETRY =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-full transition-all duration-200 ease-emphasized outline-none focus-visible:ring-4 focus-visible:ring-primary-200 active:scale-[0.97] disabled:pointer-events-none px-5 h-14 w-[70%] font-canva text-[1.05rem] font-bold";

/**
 * Canonical primary CTA — Submit, Next, Send OTP, Home, certificate download.
 * Same height, width, and font size on every screen.
 */
export const ACTION_BUTTON_CLASS = cn(
  ACTION_BUTTON_GEOMETRY,
  "bg-[#2d689d] text-white hover:bg-[#255a88] disabled:opacity-45"
);

/** Same geometry as the primary pill; white fill for the stacked second action. */
export const ACTION_BUTTON_SECONDARY_CLASS = cn(
  ACTION_BUTTON_GEOMETRY,
  "border-0 bg-white text-[#2d689d] shadow-[0_0_0_1px_rgb(45_104_157/0.22)] hover:bg-[#f7f9fb] disabled:opacity-45"
);

export function ActionButtonRow({ className, children }) {
  return (
    <div className={cn("flex w-full justify-center", className)}>{children}</div>
  );
}

const VARIANT_CLASS = {
  filled: "bg-[#2d689d] text-white hover:bg-[#255a88] disabled:opacity-45",
  tonal: "bg-primary-50 text-primary-800 shadow-none hover:bg-primary-100 disabled:opacity-45",
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
