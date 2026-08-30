"use client";

import { cva } from "class-variance-authority";
import { Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";

/**
 * Material-style action button at mobile touch sizes.
 *
 * The shadcn Button is deliberately compact for dense desktop UI; this is the
 * full-width, 48px+ affordance the app-like screens need.
 */
const appButtonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 rounded-full font-canva font-semibold transition-all duration-200 ease-emphasized outline-none focus-visible:ring-4 focus-visible:ring-primary-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        filled: "bg-primary-600 text-white hover:bg-primary-800",
        tonal: "bg-primary-50 text-primary-800 hover:bg-primary-100",
        outline: "border-2 border-border bg-surface text-foreground hover:bg-muted",
        text: "text-primary-700 hover:bg-primary-50",
        success: "bg-success text-white shadow-m1 hover:brightness-95",
        saffron: "bg-saffron text-[#4a2600] shadow-m1 hover:brightness-95",
      },
      size: {
        md: "h-12 px-5 text-sm",
        lg: "h-[3.35rem] px-6 text-[1.05rem]",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "filled", size: "lg", block: false },
  }
);

export function AppButton({
  className,
  variant,
  size,
  block,
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(appButtonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export { appButtonVariants };
