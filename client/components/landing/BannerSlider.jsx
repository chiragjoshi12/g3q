"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const INTERVAL_MS = 4000;
const SWIPE_THRESHOLD = 48;

/**
 * Two-slide (or more) banner with autoplay and finger swipe.
 * Pauses while dragging, on hover, while the tab is hidden, and when
 * the user prefers reduced motion.
 */
export function BannerSlider({ slides, className, sizes, children }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  const startX = useRef(null);
  const startY = useRef(null);
  const axis = useRef(null);
  const dragXRef = useRef(0);

  const go = useCallback(
    (next) => {
      if (count < 2) return;
      setIndex((current) => (next + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count < 2 || paused || dragging) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [count, paused, dragging]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const endDrag = useCallback(() => {
    const dx = dragXRef.current;
    startX.current = null;
    startY.current = null;
    axis.current = null;
    dragXRef.current = 0;
    setDragging(false);
    setDragX(0);
    setPaused(false);

    if (dx < -SWIPE_THRESHOLD) go(index + 1);
    else if (dx > SWIPE_THRESHOLD) go(index - 1);
  }, [go, index]);

  const onPointerDown = (event) => {
    if (count < 2 || event.button !== 0) return;
    startX.current = event.clientX;
    startY.current = event.clientY;
    axis.current = null;
    dragXRef.current = 0;
    setPaused(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic events and some browsers reject capture */
    }
  };

  const onPointerMove = (event) => {
    if (startX.current == null) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (axis.current == null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "y") {
        startX.current = null;
        setPaused(false);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
        return;
      }
    }

    if (axis.current !== "x") return;
    dragXRef.current = dx;
    setDragging(true);
    setDragX(dx);
  };

  if (count === 0) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn("relative touch-pan-y overflow-hidden", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        if (!dragging) setPaused(false);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="absolute inset-0 flex"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragging ? dragX : 0}px))`,
          transition: dragging ? "none" : "transform 500ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full min-w-full shrink-0">
            <Image
              src={src}
              alt=""
              fill
              draggable={false}
              priority={i === 0}
              sizes={sizes}
              className="pointer-events-none select-none object-cover"
            />
          </div>
        ))}
      </div>

      {children}

      {count > 1 ? (
        <div className="absolute bottom-2.5 left-0 right-0 z-10 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/55"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
