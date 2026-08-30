"use client";

import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS, AuthLink } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { appConfig } from "@/config/app.config";

/** Step 2: the code resolved to this person — confirm it, then add a phone for the OTP. */
export function IdentityStep({
  identity,
  phone,
  error,
  loading,
  onPhoneChange,
  onSubmit,
  onBack,
}) {
  if (!identity) return null;
  const initial = identity.name?.trim()?.[0] ?? "?";
  const avatarTone = "bg-primary-600";

  return (
    <form
      className="animate-screen-in space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-3 text-left">
        <h2 className="text-xl font-bold text-[#111]">તમારી ID મળી</h2>
        <div className="flex items-center gap-3.5 rounded-[1.75rem] bg-white px-4 py-4">
          <div
            className={`grid size-14 shrink-0 place-items-center rounded-full font-heading text-xl font-bold text-white ${avatarTone}`}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-heading text-base font-bold">{identity.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{identity.institute}</p>
            {identity.grade ? (
              <p className="truncate text-sm text-muted-foreground">{identity.grade}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-bold text-[#111]">
          મોબાઈલ નંબર
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          inputMode="numeric"
          placeholder="તમારો મોબાઈલ નંબર અહીં લખો"
          autoComplete="tel"
          autoFocus
          className={AUTH_FIELD_CLASS}
        />
        <p className="text-left text-xs text-muted-foreground">
          આ નંબર પર {appConfig.auth.otpLength} અંકોનો OTP મોકલવામાં આવશે.
        </p>
      </div>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="space-y-4 pt-1">
        <div className="flex w-full justify-center">
          <AppButton
            type="submit"
            loading={loading}
            disabled={phone.length !== appConfig.auth.phoneLength}
            className={AUTH_BUTTON_CLASS}
          >
            Send OTP
          </AppButton>
        </div>
        <div className="text-center">
          <AuthLink onClick={onBack}>{identity.credentialLabel} બદલો</AuthLink>
        </div>
      </div>
    </form>
  );
}
