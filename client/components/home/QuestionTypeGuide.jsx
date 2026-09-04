"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

const GUIDE_IMAGE = "/home/guide-question-type.jpg";

export const QUESTION_TYPE_GUIDES = {
  mcq: {
    title: "MCQ પ્રશ્નો",
    body: "દરેક પ્રશ્ન સાથે 4 વિકલ્પો આપેલ હશે. જેમાંથી એક સાચો જવાબ હશે. તમારે એક વિકલ્પ પસંદ કરીને સબમિટનું બટન ક્લિક કરવાનું રહેશે. ત્યાર બાદ AI તમારો જવાબ ચેક કરશે.",
  },
  blanks: {
    title: "ખાલી જગ્યા પૂરો પ્રશ્નો",
    body: "વાક્યમાં ખાલી જગ્યા આપેલ હશે. નીચે આપેલ વિકલ્પોમાંથી યોગ્ય શબ્દ પસંદ કરીને ખાલી જગ્યામાં મૂકવાનો રહેશે. સબમિટ બટન ક્લિક કર્યા પછી AI તમારો જવાબ ચેક કરશે.",
  },
  match: {
    title: "Match the pair પ્રશ્નો",
    body: "ડાબી બાજુના વિકલ્પોને જમણી બાજુના યોગ્ય જવાબ સાથે જોડવાના રહેશે. બધા જોડકાં પૂરા કરીને સબમિટ બટન ક્લિક કરો. ત્યાર બાદ AI તમારો જવાબ ચેક કરશે.",
  },
  sequence: {
    title: "Sequence પ્રશ્નો",
    body: "આપેલ વસ્તુઓને સાચા ક્રમમાં ગોઠવવાની રહેશે. ક્રમ બદલીને સબમિટ બટન ક્લિક કરો. ત્યાર બાદ AI તમારો જવાબ ચેક કરશે.",
  },
};

/**
 * Bottom-sheet explainer for a question type. Portals into the app frame so
 * the dim stays inside the phone chrome.
 */
export function QuestionTypeGuide({ typeId, open, onClose }) {
  const guide = QUESTION_TYPE_GUIDES[typeId] ?? null;
  const [frame, setFrame] = useState(() =>
    typeof document === "undefined" ? null : document.querySelector("[data-app-frame]")
  );

  useEffect(() => {
    setFrame(document.querySelector("[data-app-frame]"));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !frame || !guide) return null;

  return createPortal(
    <div className="absolute inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="બંધ કરો"
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-type-guide-title"
        aria-describedby="question-type-guide-body"
        className="animate-slide-up relative w-full overflow-hidden rounded-t-[2rem] bg-white px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-m3"
      >
        <h3
          id="question-type-guide-title"
          className="text-center font-heading text-[1.45rem] font-bold leading-tight"
          style={{
            backgroundImage: "linear-gradient(90deg, #8c52ff, #00bf63)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {guide.title}
        </h3>
        <p
          id="question-type-guide-body"
          className="mt-3 text-center font-heading text-[14px] leading-[1.65] text-[#222]"
        >
          {guide.body}
        </p>
        <div className="relative mt-4 aspect-[3/2] w-full overflow-hidden rounded-[1.15rem] bg-[#F3F4F6]">
          <Image
            src={GUIDE_IMAGE}
            alt=""
            fill
            sizes="22.5rem"
            className="object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#2d689d] font-heading text-[1.05rem] font-bold text-white transition-transform active:scale-[0.98]"
        >
          સમજાઈ ગયું
        </button>
      </div>
    </div>,
    frame
  );
}
