"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const INTERVAL_MS = 4000;

/**
 * Two-slide (or more) banner with autoplay. Pauses on hover, while the
 * tab is hidden, and when the user prefers reduced motion.
 */
export function BannerSlider({ slides, className, sizes, children }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next) => {
      if (count < 2) return;
      setIndex((current) => (next + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count < 2 || paused) return;
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
  }, [count, paused]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (count === 0) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div
        className="absolute inset-0 flex transition-transform duration-500 ease-emphasized"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full w-full min-w-full shrink-0">
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes={sizes}
              className="object-cover"
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
