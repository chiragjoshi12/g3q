"use client";

import { ArrowRight } from "@/components/icons";

import { ContentWidth } from "@/components/layout/ContentWidth";
import { cn } from "@/lib/utils";

/**
 * Material top app bar. `onBack` renders a leading back affordance — the arrow
 * points right because the UI reads in Gujarati's left-to-right script but the
 * "go back" gesture sits on the leading edge.
 */
export function TopAppBar({
  title,
  subtitle,
  onBack,
  trailing,
  tone = "primary",
  className,
}) {
  const onPrimary = tone === "primary";

  return (
    <header
      className={cn(
        "relative z-20 shrink-0",
        onPrimary
          ? "bg-primary-600 text-white"
          : "border-b border-border bg-surface text-foreground",
        className
      )}
    >
      <ContentWidth className="flex items-center gap-2 px-3 py-3 sm:px-6 lg:px-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="પાછળ જાઓ"
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full transition-colors active:scale-95",
              onPrimary ? "hover:bg-white/15" : "hover:bg-muted"
            )}
          >
            <ArrowRight className="size-5 rotate-180" />
          </button>
        ) : (
          <span className="w-2" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg leading-tight font-semibold">
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "truncate text-xs",
                onPrimary ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </ContentWidth>
    </header>
  );
}
