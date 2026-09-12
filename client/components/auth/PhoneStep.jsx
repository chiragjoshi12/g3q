"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { sanitizeMobileInput, validateMobile } from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Production step 1: mobile number only (any category). */
export function PhoneStep({ mobile, error, loading, onMobileChange, onSubmit }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const validMobile = !validateMobile(mobile);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="animate-screen-in space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-4 lg:flex lg:flex-col lg:items-center lg:gap-6 lg:space-y-0">
        <label
          htmlFor="auth-mobile"
          className="block text-[1.05rem] font-bold text-[#111] lg:text-center lg:text-[1.35rem]"
        >
          {t("enterMobileNumber")}
        </label>
        <input
          id="auth-mobile"
          ref={inputRef}
          value={mobile}
          onChange={(event) => onMobileChange(sanitizeMobileInput(event.target.value))}
          inputMode="numeric"
          autoComplete="tel"
          autoFocus
          maxLength={10}
          pattern="[6-9][0-9]{9}"
          placeholder={t("mobileNumber")}
          className={cn(
            AUTH_FIELD_CLASS,
            "translate-y-0 border border-[#D0D5DD] lg:w-[22rem] lg:text-left lg:placeholder:text-base"
          )}
        />
        <p className="text-[14px] leading-relaxed text-[#111] lg:max-w-[28rem] lg:text-center lg:whitespace-pre-line lg:text-[1.05rem]">
          {t("loginPhoneHint")}
        </p>
      </div>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error lg:mx-auto lg:max-w-[28rem]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex w-full justify-center pt-6">
        <AppButton
          type="submit"
          loading={loading}
          disabled={!validMobile}
          className={cn(AUTH_BUTTON_CLASS, "lg:!w-[14rem]")}
        >
          {t("next")}
        </AppButton>
      </div>
    </form>
  );
}
