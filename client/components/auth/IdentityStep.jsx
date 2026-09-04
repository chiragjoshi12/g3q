"use client";

import Image from "next/image";
import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS, AuthLink } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { appConfig } from "@/config/app.config";
import { BRAND_ICONS } from "@/lib/brand-icons";

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
        <div className="flex items-start gap-3.5 rounded-[1.75rem] bg-white px-4 py-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-[#d8dde3]">
            <Image
              src={BRAND_ICONS.profilePhoto}
              alt={identity.name ?? ""}
              width={112}
              height={112}
              className="size-full object-cover object-[center_18%]"
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="truncate font-heading text-xl font-bold text-[#000000]">{identity.name}</h2>
            <p className="truncate text-sm">{identity.institute}</p>
            {identity.grade ? (
              <p className="truncate text-sm">{identity.grade}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-[18px] font-bold text-[#000000]">
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
        <p className="text-left text-[12px] text-[#000000] mt-[10px]">
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
            OTP મોકલો
          </AppButton>
        </div>
        <div className="text-center">
          <AuthLink onClick={onBack}>{identity.credentialLabel} બદલો</AuthLink>
        </div>
      </div>
    </form>
  );
}
