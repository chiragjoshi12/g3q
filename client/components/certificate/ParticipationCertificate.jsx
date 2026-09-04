"use client";

import { CERT_LAYOUT, CERT_NATIVE } from "@/lib/domain/certificate";
import { cn } from "@/lib/utils";

const CERT_FONT = 'var(--font-gujarati), var(--font-noto), "Noto Sans Gujarati", "Noto Sans", sans-serif';

/**
 * Official G3Q certificate: background artwork plus the dynamic fields
 * (week, G3Q ID, category, name, school).
 */
export function ParticipationCertificate({ payload, className }) {
  if (!payload) return null;

  const school = payload.school || payload.place || payload.categoryTitle;

  return (
    <div
      className={cn("@container relative w-full overflow-hidden bg-white", className)}
      style={{ aspectRatio: `${CERT_NATIVE.width} / ${CERT_NATIVE.height}` }}
    >
      <img
        src="/certificate-bg.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
      />

      <span
        className="absolute font-bold text-[#1a1a1a]"
        style={{
          left: `${CERT_LAYOUT.week.x * 100}%`,
          top: `${CERT_LAYOUT.week.y * 100}%`,
          fontSize: `${CERT_LAYOUT.week.fontSize * 100}cqw`,
          fontFamily: CERT_FONT,
          transform: "translateY(-50%)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {payload.week}
      </span>

      <span
        className="absolute font-bold text-[#1a1a1a]"
        style={{
          right: `${(1 - CERT_LAYOUT.g3qId.x) * 100}%`,
          top: `${CERT_LAYOUT.g3qId.y * 100}%`,
          fontSize: `${CERT_LAYOUT.g3qId.fontSize * 100}cqw`,
          fontFamily: CERT_FONT,
          transform: "translateY(-50%)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        G3Q ID: {payload.g3qId}
      </span>

      <p
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[#1a1a1a]"
        style={{
          top: `${CERT_LAYOUT.category.y * 100}%`,
          width: "72%",
          fontSize: `${CERT_LAYOUT.category.fontSize * 100}cqw`,
          fontFamily: CERT_FONT,
          lineHeight: 1.2,
        }}
      >
        ({payload.categoryTitle})
      </p>

      <p
        className="absolute left-1/2 -translate-x-1/2 text-center text-[#1a1a1a]"
        style={{
          top: `${CERT_LAYOUT.body.y * 100}%`,
          width: `${CERT_LAYOUT.body.maxWidth * 100}%`,
          fontSize: `${CERT_LAYOUT.body.fontSize * 100}cqw`,
          fontFamily: CERT_FONT,
          lineHeight: CERT_LAYOUT.body.lineHeight,
        }}
      >
        This is to certify that{" "}
        <strong className="font-bold text-[#111]">{payload.name || "Participant"}</strong>
        {" "}of{" "}
        <strong className="font-bold text-[#111]">{school}</strong>
        {` has participated in the '${payload.categoryInline}' for the online weekly quiz conducted as part of 'Gujarat Gyan Guru Quiz (G3Q) 2.0' organized by the Education Department, Government of Gujarat`}
      </p>
    </div>
  );
}
