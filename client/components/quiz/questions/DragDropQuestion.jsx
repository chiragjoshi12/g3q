"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const [settledId, setSettledId] = useState(null);
  const listRef = useRef(null);
  const posRef = useRef({});
  const orderRef = useRef(order);
  orderRef.current = order;

  const labelOf = (id) => question.items.find((item) => item.id === id)?.label ?? "";
  const numberOf = (id) => question.items.findIndex((item) => item.id === id) + 1;
  const canDrag = !disabled && !revealed;

  const startDrag = (id) => (event) => {
    if (!canDrag) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setSettledId(null);
    setDraggingId(id);
  };

  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;

    root.querySelectorAll("[data-item-id]").forEach((node) => {
      const id = node.dataset.itemId;
      const top = node.getBoundingClientRect().top;
      const prev = posRef.current[id];
      posRef.current[id] = top;
      if (prev == null || Math.abs(prev - top) < 1) return;

      const dy = prev - top;
      node.style.transition = "none";
      node.style.transform = `translateY(${dy}px)`;
      node.style.zIndex = id === draggingId ? "12" : "1";
      void node.offsetHeight;
      node.style.transition = "transform 280ms cubic-bezier(0.2, 0, 0, 1)";
      node.style.transform = "";
    });
  }, [order, draggingId]);

  useEffect(() => {
    if (!draggingId) return undefined;

    const idAt = (clientX, clientY) => {
      const el = document.elementFromPoint(clientX, clientY);
      return el?.closest("[data-item-id]");
    };

    const handleMove = (event) => {
      const hover = idAt(event.clientX, event.clientY);
      const hoverId = hover?.dataset.itemId;
      if (!hoverId || hoverId === draggingId) return;

      const current = orderRef.current;
      const from = current.indexOf(draggingId);
      const to = current.indexOf(hoverId);
      if (from === -1 || to === -1) return;

      const mid = hover.getBoundingClientRect().top + hover.getBoundingClientRect().height / 2;
      if (from < to && event.clientY < mid) return;
      if (from > to && event.clientY > mid) return;

      onChange(move(current, from, to));
    };

    const handleUp = () => {
      setSettledId(draggingId);
      setDraggingId(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [draggingId, onChange]);

  useEffect(() => {
    if (!settledId) return undefined;
    const timer = window.setTimeout(() => setSettledId(null), 520);
    return () => window.clearTimeout(timer);
  }, [settledId]);

  return (
    <div className="mx-auto w-full space-y-4">
      {!revealed ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary-600">
          <BrandIcon
            src={BRAND_ICONS.drag}
            alt=""
            className="size-5 shrink-0"
          />
          ખેંચીને ક્રમ બદલો
        </p>
      ) : null}

      <ul
        ref={listRef}
        className={cn("space-y-3", draggingId && "select-none")}
      >
        {order.map((id) => {
          const isDragging = draggingId === id;
          const justMoved = settledId === id;

          return (
            <li key={id} data-item-id={id} className="relative">
              <div
                onPointerDown={canDrag ? startDrag(id) : undefined}
                className={cn(
                  "flex items-center gap-2 touch-none",
                  canDrag && "cursor-grab active:cursor-grabbing"
                )}
              >
                <div
                  className={cn(
                    "flex min-h-[3.85rem] min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] bg-white py-4 pl-5 pr-4 sm:min-h-[4.25rem]",
                    "border transition-[transform,box-shadow,border-color,background-color] duration-200 ease-emphasized",
                    isDragging &&
                      "z-10 scale-[1.02] border-[2px] border-[#2d689d] bg-[#F4F8FC] shadow-[0_12px_28px_rgb(44_102_152/0.18)]",
                    justMoved && !isDragging && "border-[2px] border-primary-400 bg-primary-50",
                    !isDragging && !justMoved && "border-[1px] border-[#d9d9d9]"
                  )}
                >
                  <span className="min-w-0 flex-1 text-left font-canva text-[0.98rem] leading-snug font-medium text-[#111] sm:text-[1.05rem]">
                    {labelOf(id)}
                  </span>
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full font-heading text-sm font-bold tabular-nums",
                      isDragging
                        ? "bg-[#2d689d] text-white"
                        : "bg-[#f5f5f5] text-[#2d689d]"
                    )}
                  >
                    {numberOf(id)}
                  </span>
                </div>

                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center",
                    isDragging && "opacity-100",
                    !canDrag && "opacity-30"
                  )}
                  aria-hidden
                >
                  <BrandIcon
                    src={BRAND_ICONS.changeSequence}
                    alt=""
                    className="size-5"
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
