"use client";

import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { appConfig } from "@/config/app.config";
import { validatePhone } from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Production step 1: mobile number only (any category). */
export function PhoneStep({ phone, error, loading, onPhoneChange, onSubmit }) {
  const { t } = useI18n();
  const validPhone = !validatePhone(phone);

  return (
    <form
      className="animate-screen-in space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-4">
        <label htmlFor="auth-phone" className="block text-[1.05rem] font-bold text-[#111]">
          {t("enterMobileNumber")}
        </label>
        <input
          id="auth-phone"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          inputMode="numeric"
          autoComplete="tel"
          autoFocus
          placeholder={t("mobileNumber")}
          className={cn(AUTH_FIELD_CLASS, "translate-y-0 border border-[#D0D5DD]")}
        />
        <p className="text-[14px] leading-relaxed text-[#111]">{t("loginPhoneHint")}</p>
      </div>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex w-full justify-center pt-6">
        <AppButton
          type="submit"
          loading={loading}
          disabled={!validPhone || phone.length !== appConfig.auth.phoneLength}
          className={AUTH_BUTTON_CLASS}
        >
          {t("next")}
        </AppButton>
      </div>
    </form>
  );
}
