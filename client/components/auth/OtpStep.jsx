"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AuthLink } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { OtpInput } from "@/components/common/OtpInput";
import { appConfig } from "@/config/app.config";
import { useI18n } from "@/lib/i18n";

/** Step 3: static OTP verification. */
export function OtpStep({
  otp,
  error,
  loading,
  onOtpChange,
  onVerify,
  onBack,
}) {
  const { t } = useI18n();
  const [resendIn, setResendIn] = useState(appConfig.auth.resendSeconds);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  return (
    <div className="animate-screen-in space-y-7">
      <div className="space-y-4">
        <h2 className="text-left text-xl font-bold text-[#111]">{t("enterOtp")}</h2>
        <OtpInput
          length={appConfig.auth.otpLength}
          value={otp}
          onChange={onOtpChange}
          onComplete={onVerify}
          invalid={Boolean(error)}
          autoFocus
        />
        <div className="text-sm">
          {resendIn > 0 ? (
            <span className="text-muted-foreground">{t("resendOtp")} · {resendIn}s</span>
          ) : (
            <AuthLink
              className="text-foreground no-underline hover:text-primary-700 hover:underline"
              onClick={() => setResendIn(appConfig.auth.resendSeconds)}
            >
              {t("resendOtp")}
            </AuthLink>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-4 pt-2">
        <div className="flex w-full justify-center">
          <AppButton
            loading={loading}
            disabled={otp.length !== appConfig.auth.otpLength}
            onClick={onVerify}
            className={AUTH_BUTTON_CLASS}
          >
            {t("submit")}
          </AppButton>
        </div>
        <div className="text-center text-color-[#000000]">
          <AuthLink onClick={onBack}>{t("changeMobileNumber")}</AuthLink>
        </div>
      </div>
    </div>
  );
}
