"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AuthLink } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { OtpInput } from "@/components/common/OtpInput";
import { appConfig } from "@/config/app.config";

/** Step 3: static OTP verification. */
export function OtpStep({
  otp,
  error,
  loading,
  onOtpChange,
  onVerify,
  onBack,
}) {
  const [resendIn, setResendIn] = useState(appConfig.auth.resendSeconds);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  return (
    <div className="animate-screen-in space-y-7">
      <div className="space-y-4">
        <h2 className="text-center text-xl font-bold text-[#111]">OTP અહીં નાખો</h2>
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
            <span className="text-muted-foreground">ફરી OTP મંગાવો · {resendIn}s</span>
          ) : (
            <AuthLink
              className="text-foreground no-underline hover:text-primary-700 hover:underline"
              onClick={() => setResendIn(appConfig.auth.resendSeconds)}
            >
              ફરી OTP મંગાવો
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
        <AppButton
          block
          loading={loading}
          disabled={otp.length !== appConfig.auth.otpLength}
          onClick={onVerify}
          className={AUTH_BUTTON_CLASS}
        >
          Submit
        </AppButton>
        <div className="text-center">
          <AuthLink onClick={onBack}>મોબાઈલ નંબર બદલો</AuthLink>
        </div>
      </div>
    </div>
  );
}
