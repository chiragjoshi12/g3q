"use client";

import { useEffect, useState } from "react";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

function move(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function DragDropQuestion({ question, value, onChange, disabled, revealed }) {
  const order = value ?? question.items.map((item) => item.id);
  const [draggingId, setDraggingId] = useState(null);

  const labelOf = (id) => question.items.find((item) => item.id === id)?.label ?? "";

  const startDrag = (id) => (event) => {
    if (disabled) return;
    event.preventDefault();
    setDraggingId(id);
  };

  useEffect(() => {
    if (!draggingId) return undefined;

    const idAt = (clientX, clientY) => {
      const el = document.elementFromPoint(clientX, clientY);
      return el?.closest("[data-item-id]")?.dataset.itemId ?? null;
    };

    const handleMove = (event) => {
      const hoverId = idAt(event.clientX, event.clientY);
      if (!hoverId || hoverId === draggingId) return;
      const from = order.indexOf(draggingId);
      const to = order.indexOf(hoverId);
      if (from === -1 || to === -1) return;
      onChange(move(order, from, to));
    };

    const handleUp = () => setDraggingId(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, order]);

  return (
    <div className="mx-auto w-full space-y-4">
      {!revealed ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary-600">
          <BrandIcon src={BRAND_ICONS.drag} alt="" className="size-4" />
          ખેંચીને ક્રમ બદલો
        </p>
      ) : null}

      <ul className="space-y-2.5">
        {order.map((id, index) => {
          const correctHere = revealed && question.answer[index] === id;
          const isDragging = draggingId === id;

          return (
            <li key={id} data-item-id={id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border bg-white px-4 py-3.5 shadow-m1 transition-all duration-200",
                  isDragging && "opacity-50 shadow-m2",
                  !revealed && "border-[#E2E8F0]",
                  revealed && correctHere && "border-success bg-success/10",
                  revealed && !correctHere && "border-error bg-error/10"
                )}
              >
                <span className="min-w-0 flex-1 text-sm leading-snug font-medium">
                  {labelOf(id)}
                  {revealed && !correctHere ? (
                    <span className="mt-0.5 block text-[11px] text-success">
                      ✓ અહીં આવે: {labelOf(question.answer[index])}
                    </span>
                  ) : null}
                </span>

                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full font-heading text-xs font-bold",
                    revealed
                      ? correctHere
                        ? "bg-success text-white"
                        : "bg-error text-white"
                      : "bg-[#DCEAF4] text-primary-700"
                  )}
                >
                  {revealed ? (
                    correctHere ? (
                      <BrandIcon src={BRAND_ICONS.correct} alt="" className="size-5" />
                    ) : (
                      <BrandIcon src={BRAND_ICONS.incorrect} alt="" className="size-5" />
                    )
                  ) : (
                    index + 1
                  )}
                </span>
              </div>

              {!disabled ? (
                <span
                  onPointerDown={startDrag(id)}
                  className="grid size-8 shrink-0 touch-none place-items-center text-muted-foreground transition-transform active:scale-110 active:cursor-grabbing"
                >
                  <BrandIcon src={BRAND_ICONS.changeSequence} alt="" className="size-5 cursor-grab" />
                </span>
              ) : (
                <BrandIcon src={BRAND_ICONS.changeSequence} alt="" className="size-5 shrink-0 opacity-30" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
