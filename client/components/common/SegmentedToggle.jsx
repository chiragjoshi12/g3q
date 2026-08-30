"use client";

import { cn } from "@/lib/utils";

/**
 * Material segmented button. The active thumb is a single sliding element, so
 * the transition stays smooth regardless of how many segments are supplied.
 */
export function SegmentedToggle({ items, value, onChange, className }) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value)
  );

  return (
    <div
      role="tablist"
      className={cn(
        "relative grid rounded-full border border-[#D5DCE3] bg-white p-1",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-[#EEF1F4] transition-transform duration-300 ease-emphasized"
        style={{
          width: `calc((100% - 0.5rem) / ${items.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative z-10 rounded-full px-3 py-2.5 text-center transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="block text-sm leading-tight font-semibold">{item.label}</span>
            {item.caption ? (
              <span className="block text-[11px] leading-tight opacity-70">
                {item.caption}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
