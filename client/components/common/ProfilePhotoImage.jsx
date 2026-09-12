"use client";

import { useEffect, useState } from "react";

/**
 * Renders a profile photo with a stable `src` so React remounts / navigations
 * reuse the browser HTTP cache (Azure sends long-lived Cache-Control on new uploads).
 */
export function ProfilePhotoImage({ src, alt = "", className, width = 240, height = 240 }) {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      return undefined;
    }
    if (src === displaySrc) return undefined;

    let cancelled = false;
    const probe = new window.Image();
    probe.decoding = "async";
    probe.onload = () => {
      if (!cancelled) setDisplaySrc(src);
    };
    probe.onerror = () => {
      if (!cancelled) setDisplaySrc(src);
    };
    probe.src = src;
    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src, displaySrc]);

  if (!displaySrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote Azure URLs; rely on browser cache
    <img
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      draggable={false}
    />
  );
}
