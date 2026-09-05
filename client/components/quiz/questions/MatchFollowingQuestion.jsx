"use client";

import { Fragment, useState } from "react";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Drag a right-side option onto its match on the left — the left side is
 * fixed, only the options move.
 *
 * Same interaction as DragIntoBlanksQuestion: native drag-and-drop for
 * desktop, plus tap-to-select → tap-to-place so the same component works on
 * touch, where dragstart never fires. Tapping a filled slot clears it, and an
 * already-placed option can be re-dragged (or re-selected) straight onto a
 * different row to re-pair it.
 */
export function MatchFollowingQuestion({ question, value, onChange, disabled, revealed }) {
  const pairs = value ?? {};
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState(null);
  const [overLeftId, setOverLeftId] = useState(null);

  const usedRightIds = new Set(Object.values(pairs));
  const labelOfRight = (id) => question.right.find((r) => r.id === id)?.label ?? "";

  const connect = (leftId, rightId) => {
    if (!rightId) return;
    const next = Object.fromEntries(Object.entries(pairs).filter(([, rId]) => rId !== rightId));
    next[leftId] = rightId;
    onChange(next);
    setSelected(null);
    setDragging(null);
    setOverLeftId(null);
  };

  const unlink = (leftId) => {
    if (disabled) return;
    const next = { ...pairs };
    delete next[leftId];
    onChange(next);
  };

  const handleLeftClick = (leftId) => {
    if (disabled) return;
    if (pairs[leftId]) return;
    if (selected) connect(leftId, selected);
  };

  const handleSlotClick = (leftId) => {
    if (disabled) return;
    if (pairs[leftId]) {
      unlink(leftId);
      return;
    }
    if (selected) connect(leftId, selected);
  };

  const dropHandlers = (leftId) => ({
    onDragOver: (event) => {
      event.preventDefault();
      setOverLeftId(leftId);
    },
    onDragLeave: () => setOverLeftId(null),
    onDrop: (event) => {
      event.preventDefault();
      connect(leftId, dragging);
    },
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {question.left.map((left) => {
          const pairedTo = pairs[left.id];
          const isOverTarget = overLeftId === left.id;

          return (
            <Fragment key={left.id}>
              <div
                onClick={() => handleLeftClick(left.id)}
                {...dropHandlers(left.id)}
                className={cn(
                  "flex min-h-[3.6rem] items-center justify-center rounded-[1.15rem] border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-medium",
                  !disabled && "cursor-pointer"
                )}
              >
                <span className="min-w-0 leading-snug">{left.label}</span>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => handleSlotClick(left.id)}
                {...dropHandlers(left.id)}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-[1.15rem] border px-3.5 py-2.5 text-center text-sm transition-all bg-[#f5f5f5]",
                  !pairedTo && !isOverTarget && "border-dashed border-[#d9d9d9] text-muted-foreground/60",
                  isOverTarget && "border-primary-500 bg-primary-50 text-primary-700",
                  pairedTo && !isOverTarget && "border-primary-700 bg-primary-700 text-white"
                )}
              >
                {pairedTo ? labelOfRight(pairedTo) : "અહીં મૂકો"}
              </button>
            </Fragment>
          );
        })}
      </div>

      {!revealed ? (
        <>
          <p className="flex items-center gap-1.5 pt-2 pb-2 text-[14px] text-primary-600">
            <BrandIcon src={BRAND_ICONS.drag} alt="" className="size-4 shrink-0" />
            વિકલ્પ પસંદ કરીને ડાબી બાજુ પર ટૅપ કરો, અથવા ખેંચીને મૂકો
          </p>
          <div className="flex flex-wrap gap-2 pb-1">
            {question.right.map((right) => {
              const used = usedRightIds.has(right.id);

              return (
                <button
                  key={right.id}
                  type="button"
                  draggable={!disabled}
                  disabled={disabled}
                  onDragStart={() => setDragging(right.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOverLeftId(null);
                  }}
                  onClick={() => setSelected((current) => (current === right.id ? null : right.id))}
                  className={cn(
                    "h-[2.85rem] rounded-full px-7 py-2 font-heading text-[14px] font-medium transition-all",
                    "shadow-[0_2.5px_0_#d9d9d9]",
                    !disabled && "cursor-grab active:scale-95 active:cursor-grabbing",
                    used && "border-dashed border-[#C5D0DA] bg-[#EEF1F4] text-muted-foreground/50",
                    !used && selected === right.id
                      ? "border-primary-700 bg-primary-700 text-white"
                      : !used && "border-[#D5DCE3] bg-white hover:border-primary-400"
                  )}
                >
                  {right.label}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
