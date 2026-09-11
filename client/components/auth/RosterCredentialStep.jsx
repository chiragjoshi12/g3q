"use client";

import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { getCredentialRule, validateCredential } from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Signup school/college: enter CTS / ABC id after category pick. */
export function RosterCredentialStep({
  role,
  credential,
  error,
  loading,
  onCredentialChange,
  onSubmit,
}) {
  const { t } = useI18n();
  const rule = role ? getCredentialRule(role) : null;
  const credentialValid = rule ? !validateCredential(role, credential) : false;

  if (!rule) return null;

  return (
    <form
      className="animate-screen-in space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-4">
        <label htmlFor="roster-credential" className="block text-[16px] font-bold text-[#000000]">
          {rule.label}
        </label>
        <input
          id="roster-credential"
          value={credential}
          onChange={(event) =>
            onCredentialChange(event.target.value.replace(/\D/g, "").slice(0, rule.length))
          }
          inputMode={rule.inputMode}
          placeholder={rule.hint}
          autoFocus
          className={cn(AUTH_FIELD_CLASS, "translate-y-0 border border-[#D0D5DD]")}
        />
      </div>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex w-full justify-center pt-4">
        <AppButton
          type="submit"
          loading={loading}
          disabled={!credential || !credentialValid}
          className={AUTH_BUTTON_CLASS}
        >
          {t("next")}
        </AppButton>
      </div>
    </form>
  );
}
