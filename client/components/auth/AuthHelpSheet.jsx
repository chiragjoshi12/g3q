"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { BrandIcon } from "@/components/common/BrandIcon";
import { SheetCloseButton } from "@/components/common/SheetCloseButton";
import { DESKTOP_OVERLAY_CARD } from "@/components/layout/desktop-overlay";
import { ChevronDown, ChevronUp } from "@/components/icons";
import { ROUTES } from "@/config/routes";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const AUTH_PHONE_HELP_ITEM_KEYS = [
  { id: "which-mobile", questionKey: "authHelpWhichMobileQ", answerKey: "authHelpWhichMobileA" },
  { id: "login-required", questionKey: "authHelpLoginRequiredQ", answerKey: "authHelpLoginRequiredA" },
];

export const AUTH_OTP_HELP_ITEM_KEYS = [
  { id: "otp-not-received", questionKey: "authHelpOtpNotReceivedQ", answerKey: "authHelpOtpNotReceivedA" },
  { id: "otp-resend-stopped", questionKey: "authHelpOtpResendStoppedQ", answerKey: "authHelpOtpResendStoppedA" },
  { id: "otp-change-mobile", questionKey: "authHelpOtpChangeMobileQ", answerKey: "authHelpOtpChangeMobileA" },
];

export const AUTH_REGISTER_HELP_ITEM_KEYS = [
  { id: "cts-apaar", questionKey: "authHelpCtsApaarQ", answerKey: "authHelpCtsApaarA" },
  { id: "citizen-id", questionKey: "authHelpCitizenIdQ", answerKey: "authHelpCitizenIdA" },
];

export const AUTH_REGISTER_INTRO_KEYS = [
  { titleKey: "authHelpRegisterCat1Title", bodyKey: "authHelpRegisterCat1Body" },
  { titleKey: "authHelpRegisterCat2Title", bodyKey: "authHelpRegisterCat2Body" },
  { titleKey: "authHelpRegisterCat3Title", bodyKey: "authHelpRegisterCat3Body" },
];

/**
 * Auth-step help sheet: accordion FAQs + Ask G3Q AI.
 * Portals into the app frame so the dim stays inside the phone chrome.
 */
export function AuthHelpSheet({
  open,
  onClose,
  items,
  title,
  introHeading,
  introItems,
  defaultOpenId,
}) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState(null);
  const frame = typeof document === "undefined" ? null : document.querySelector("[data-app-frame]");
  const heading = title || t("help");
  const hasIntro = Boolean(introHeading || introItems?.length);

  useEffect(() => {
    if (!open) {
      setOpenId(null);
      return undefined;
    }
    setOpenId(defaultOpenId || null);
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const main = frame?.querySelector("main");
    const previousOverflow = main?.style.overflow;
    if (main) main.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (main) main.style.overflow = previousOverflow || "";
    };
  }, [open, onClose, defaultOpenId, frame]);

  if (!open || !frame) return null;

  return createPortal(
    <div className="absolute inset-0 z-[60] overflow-hidden overscroll-none lg:flex lg:items-center lg:justify-center">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/[0.06] backdrop-blur-[2px] lg:bg-black/20"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-help-sheet-title"
        onWheel={(event) => event.stopPropagation()}
        className={cn(
          "no-scrollbar animate-slide-up absolute inset-x-0 bottom-0 z-10 max-h-[85%] w-full touch-pan-y overflow-y-auto overscroll-contain rounded-t-[2.25rem] bg-white shadow-m3",
          DESKTOP_OVERLAY_CARD,
          "lg:relative lg:inset-auto lg:bottom-auto lg:w-[min(28rem,90vw)] lg:max-h-[min(36rem,82dvh)]"
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="sticky top-0 z-20 bg-white px-5 pt-5 lg:px-6 lg:pt-6">
          <SheetCloseButton onClick={onClose} />
          <div className="relative flex items-center justify-center">
            <h3
              id="auth-help-sheet-title"
              className="px-10 text-center font-heading text-[18px] font-bold leading-snug text-[#111]"
            >
              {heading}
            </h3>
          </div>
        </div>

        <div className="px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-6 lg:pb-6">
          {hasIntro ? (
            <div className="text-[14px] leading-relaxed text-[#111]">
              {introHeading ? <p className="mb-2">{introHeading}</p> : null}
              {introItems?.length ? (
                <ol className="space-y-3">
                  {introItems.map((item, index) => (
                    <li key={item.title}>
                      <span className="font-bold">
                        {index + 1}. {item.title}
                      </span>
                      {" - "}
                      {item.body}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}

          <div className={cn("flex flex-col gap-1.5", hasIntro && "mt-4")}>
            {items.map((item) => {
              const expanded = openId === item.id;
              const answerParts = String(item.answer || "")
                .split(/\n\n+/)
                .filter(Boolean);
              const Chevron = expanded ? ChevronUp : ChevronDown;

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[1.35rem] bg-[#F5F5F5]"
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpenId(expanded ? null : item.id)}
                    className={cn(
                      "flex min-h-[4.25rem] w-full touch-pan-y items-center gap-3 px-5 text-left",
                      expanded ? "pt-5 pb-2" : "py-5"
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 font-heading text-[15px] leading-[1.5] text-[#111]",
                        expanded ? "font-bold" : "font-medium"
                      )}
                    >
                      {item.question}
                    </span>
                    <Chevron className="size-5 shrink-0 text-[#6B7280]" />
                  </button>
                  {expanded ? (
                    <div className="space-y-3 px-5 pt-0 pb-4 text-[14px] leading-relaxed text-[#111]">
                      {answerParts.map((part) => (
                        <p key={part}>{part}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center">
            <Link
              href={ROUTES.g3qAi}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 py-1 transition-transform active:scale-95"
            >
              <BrandIcon src={BRAND_ICONS.navG3qAi} alt="" className="size-5" />
              <span className="bg-gradient-to-r from-[#8c52ff] to-[#ff914d] bg-clip-text text-[15px] font-medium text-transparent underline decoration-[#ff914d] underline-offset-[3px]">
                {t("askG3qAi")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>,
    frame
  );
}
