"use client";

import { useState } from "react";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Drag word-bank chips into the blanks of a sentence.
 *
 * Supports both native drag and tap-to-select → tap-to-place, so the same
 * component works on desktop and touch. Tapping a filled blank returns its
 * chip to the bank.
 */
export function DragIntoBlanksQuestion({ question, value, onChange, disabled, revealed }) {
  const filled = value ?? {};
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState(null);
  const [overBlank, setOverBlank] = useState(null);

  const usedWordIds = new Set(Object.values(filled).filter(Boolean));
  const labelOf = (wordId) => question.bank.find((w) => w.id === wordId)?.label ?? "";

  const place = (blankId, wordId) => {
    if (!wordId) return;
    // A word can only occupy one blank; clear any previous placement.
    const next = Object.fromEntries(
      Object.entries(filled).filter(([, id]) => id !== wordId)
    );
    next[blankId] = wordId;
    onChange(next);
    setSelected(null);
    setDragging(null);
    setOverBlank(null);
  };

  const clearBlank = (blankId) => {
    const next = { ...filled };
    delete next[blankId];
    onChange(next);
  };

  const handleBlankClick = (blankId) => {
    if (disabled) return;
    if (filled[blankId]) {
      clearBlank(blankId);
      return;
    }
    if (selected) place(blankId, selected);
  };

  // Blank numbering is computed up front rather than incremented inside the
  // render callback, which would mutate a captured binding mid-render.
  const blankNumbers = new Map(
    question.segments
      .filter((segment) => segment.type === "blank")
      .map((segment, index) => [segment.id, index + 1])
  );

  return (
    <div>
      {/* Sentence with inline blanks */}
      <div className="rounded-[1.40rem] border border-[#E2E8F0] bg-white p-4 text-base leading-[1.7] shadow-m1">
        {question.segments.map((segment, index) => {
          if (segment.type === "text") {
            return (
              <span key={index} className="align-middle">
                {segment.value}{" "}
              </span>
            );
          }

          const wordId = filled[segment.id];

          return (
            <button
              key={segment.id}
              type="button"
              disabled={disabled}
              onClick={() => handleBlankClick(segment.id)}
              onDragOver={(event) => {
                event.preventDefault();
                setOverBlank(segment.id);
              }}
              onDragLeave={() => setOverBlank(null)}
              onDrop={(event) => {
                event.preventDefault();
                place(segment.id, dragging);
              }}
              className={cn(
                "mx-1 my-1 inline-flex min-w-24 h-[2.8rem] items-center justify-center gap-1 rounded-lg border px-2.5 py-1 align-middle font-heading text-sm font-semibold transition-all",
                !wordId && "border-dashed",
                overBlank === segment.id && "scale-105 border-primary-500 bg-primary-50",
                wordId && "border-primary-500 bg-primary-50 text-primary-800",
                !wordId && "border-primary-300 text-muted-foreground/60"
              )}
            >
              {wordId ? labelOf(wordId) : `___ ${blankNumbers.get(segment.id)}`}
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <>
          <p className="mt-6 mb-6 flex items-center gap-1.5 text-sm font-medium text-primary-600">
            <BrandIcon src={BRAND_ICONS.drag} alt="" className="size-4" />
            શબ્દ પસંદ કરીને ખાલી જગ્યા પર ટૅપ કરો, અથવા ખેંચીને મૂકો
          </p>
          <div className="flex flex-wrap gap-2">
            {question.bank.map((word) => {
              const used = usedWordIds.has(word.id);
              return (
                <button
                  key={word.id}
                  type="button"
                  draggable={!disabled && !used}
                  disabled={disabled || used}
                  onDragStart={() => setDragging(word.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOverBlank(null);
                  }}
                  onClick={() => setSelected((current) => (current === word.id ? null : word.id))}
                  className={cn(
                    "rounded-full border px-4 py-2 h-[3.1rem] font-heading text-sm font-medium transition-all",
                    !disabled && !used && "cursor-grab active:scale-95 active:cursor-grabbing",
                    used && "border-dashed border-[#C5D0DA] bg-[#EEF1F4] text-muted-foreground/40 line-through",
                    !used && selected === word.id
                      ? "border-primary-700 bg-primary-700 text-white"
                      : !used && "border-[#D5DCE3] bg-white hover:border-primary-400"
                  )}
                >
                  {word.label}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
