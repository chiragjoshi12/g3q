"use client";

import { BrandIcon } from "@/components/common/BrandIcon";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

const BLUE = "#2d689d";
const SIDE_BG = "#f5f5f5";
const PLAY_SIZE = 88;
const CUT_GAP = 10;
const CUT_DIAMETER = PLAY_SIZE + CUT_GAP * 2;
/** Raised Play Quiz — slid slightly into the white tray. */
const PLAY_TOP = 10;
/** Tray starts so the circle center sits near the tray top edge. */
const TRAY_PAD_TOP = PLAY_TOP + PLAY_SIZE * 0.52;
/** Notch center relative to tray top (negative = above the tray edge). */
const NOTCH_OFFSET_Y = PLAY_TOP + PLAY_SIZE / 2 - TRAY_PAD_TOP;

/**
 * Bottom bar: Practice | raised Play Quiz (notch) | G3Q AI.
 * Notch disc behind Play Quiz is #f5f5f5; the blue Play pill sits on top.
 */
export function LandingActionNav({
  onPractice,
  onPlayQuiz,
  onG3qAi,
  className,
  floating = false,
}) {
  return (
    <footer
      className={cn(
        floating ? "pointer-events-none absolute inset-x-0 bottom-0 z-30" : "relative z-20 shrink-0",
        className
      )}
    >
      <div
        className="pointer-events-auto relative"
        style={{
          paddingTop: TRAY_PAD_TOP,
          // Pull raised Play Quiz over content instead of reserving a solid band
          ...(floating ? null : { marginTop: -TRAY_PAD_TOP }),
        }}
      >
        {/* Soft gray shadow veil — transparent, content readable underneath */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0"
          style={{
            top: TRAY_PAD_TOP - 36,
            height: 36,
            background:
              "linear-gradient(to top, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0.04) 50%, transparent 100%)",
          }}
        />

        <div
          className="relative overflow-hidden rounded-t-[1.65rem]"
          style={{
            filter: "drop-shadow(0 -12px 28px rgba(15, 23, 42, 0.14))",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 z-0 rounded-full"
            style={{
              top: NOTCH_OFFSET_Y,
              width: CUT_DIAMETER,
              height: CUT_DIAMETER,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 0 100vmax #ffffff",
            }}
          />

          <nav
            aria-label="Primary actions"
            className="relative z-[1] px-3.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1"
          >
            <div className="flex h-[4.05rem] items-center justify-between">
              <SideAction onClick={onPractice} label="Practice">
                <BrandIcon src={BRAND_ICONS.navPractice} alt="" className="size-[1.5rem]" priority />
              </SideAction>

              <div className="w-[6.25rem] shrink-0" aria-hidden />

              <SideAction onClick={onG3qAi} label="G3Q AI">
                <BrandIcon src={BRAND_ICONS.navG3qAi} alt="" className="size-[1.5rem]" priority />
              </SideAction>
            </div>
          </nav>
        </div>

        {/* Solid #f5f5f5 ring behind Play Quiz (outside overflow clip — fully opaque) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 z-[5] -translate-x-1/2 rounded-full"
          style={{
            top: PLAY_TOP - CUT_GAP,
            width: CUT_DIAMETER,
            height: CUT_DIAMETER,
            backgroundColor: SIDE_BG,
            opacity: 1,
          }}
        />

        <button
          type="button"
          onClick={onPlayQuiz}
          aria-label="Play Quiz"
          className="absolute left-1/2 z-10 -translate-x-1/2 transition-transform active:scale-[0.975]"
          style={{ top: PLAY_TOP }}
        >
          <span
            className="grid place-items-center rounded-full"
            style={{
              width: PLAY_SIZE,
              height: PLAY_SIZE,
              backgroundColor: BLUE,
              boxShadow: "0 8px 22px rgba(45, 104, 157, 0.30)",
            }}
          >
            <span
              aria-hidden
              className="block size-[2.15rem] bg-white"
              style={{
                WebkitMaskImage: `url(${BRAND_ICONS.navPlayQuiz})`,
                maskImage: `url(${BRAND_ICONS.navPlayQuiz})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          </span>
        </button>
      </div>
    </footer>
  );
}

function SideAction({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[3.85rem] w-[6.5rem] shrink-0 flex-col items-center justify-center rounded-[1.2rem] px-1 font-canva active:opacity-90"
      style={{ backgroundColor: SIDE_BG, color: BLUE }}
    >
      <span className="flex -translate-y-[3px] flex-col items-center gap-1">
        {children}
        <span className="text-[12.5px] font-medium leading-none tracking-[-0.01em]">{label}</span>
      </span>
    </button>
  );
}
