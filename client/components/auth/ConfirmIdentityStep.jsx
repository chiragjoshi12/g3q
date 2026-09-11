"use client";

import Image from "next/image";
import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";

/** Confirm an existing or looked-up identity before entering the app. */
export function ConfirmIdentityStep({
  identity,
  error,
  loading,
  onConfirm,
  confirmLabel,
}) {
  const { t } = useI18n();
  if (!identity) return null;

  return (
    <div className="animate-screen-in space-y-10">
      <div className="space-y-4">
        <h2 className="text-left text-xl font-bold text-[#111] lg:text-[1.65rem]">
          {t("yourIdFoundShort")}
        </h2>
        <div className="flex items-start gap-3.5 rounded-[1.75rem] bg-white px-4 py-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-[#2d689d]">
            {identity.profilePhoto ? (
              <Image
                src={identity.profilePhoto}
                alt={identity.name ?? ""}
                width={112}
                height={112}
                className="size-full object-cover"
              />
            ) : (
              <Image
                src={BRAND_ICONS.profilePhoto}
                alt={identity.name ?? ""}
                width={112}
                height={112}
                className="size-full object-cover object-[center_18%]"
              />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate font-heading text-xl font-bold text-[#000000]">
              {identity.name}
            </h3>
            {identity.institute ? (
              <p className="mt-0.5 text-sm leading-snug text-[#111]">{identity.institute}</p>
            ) : null}
            {identity.grade ? (
              <p className="mt-0.5 text-sm text-[#111]">{identity.grade}</p>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-center text-[15px] font-medium text-[#111]">{t("confirmIfYourId")}</p>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex w-full justify-center">
        <AppButton loading={loading} onClick={onConfirm} className={AUTH_BUTTON_CLASS}>
          {confirmLabel || t("confirm")}
        </AppButton>
      </div>
    </div>
  );
}
