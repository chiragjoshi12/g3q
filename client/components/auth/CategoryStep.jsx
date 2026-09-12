"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "@/components/icons";

import {
  AUTH_BUTTON_CLASS,
  AUTH_FIELD_CLASS,
  AuthLink,
} from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import {
  ROLE,
  getCredentialRule,
  getRoleTabs,
  usesRosterIdentity,
  validateCredential,
} from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** New-user signup: pick school / college / citizen, then roster ID if needed. */
export function CategoryStep({
  selectedRole,
  credential,
  error,
  loading,
  onSelect,
  onCredentialChange,
  onSubmit,
  onContinueCitizen,
  onLearnId,
}) {
  const { t } = useI18n();
  const credentialRef = useRef(null);
  const roleTabs = getRoleTabs();
  const rule = selectedRole && usesRosterIdentity(selectedRole) ? getCredentialRule(selectedRole) : null;
  const credentialValid = rule ? !validateCredential(selectedRole, credential) : false;
  const placeholder =
    selectedRole === ROLE.STUDENT
      ? t("enterCtsCode")
      : selectedRole === ROLE.COLLEGE
        ? t("enterApparId")
        : rule?.hint;
  const fieldLabel =
    selectedRole === ROLE.STUDENT
      ? t("yourCtsNumber")
      : selectedRole === ROLE.COLLEGE
        ? t("apparIdLabel")
        : rule?.label;
  const dontKnowLabel =
    selectedRole === ROLE.COLLEGE ? t("authHelpDontKnowAppar") : t("authHelpDontKnowCts");

  useEffect(() => {
    if (!selectedRole || !usesRosterIdentity(selectedRole)) return;
    credentialRef.current?.focus();
  }, [selectedRole]);

  return (
    <div className="animate-screen-in space-y-6">
      <p className="text-[15px] leading-relaxed text-[#111]">{t("chooseStudyType")}</p>

      <div role="list" aria-label={t("register")} className="grid grid-cols-3 gap-1.5">
        {roleTabs.map((item) => {
          const selected = item.id === selectedRole;
          return (
            <button
              key={item.id}
              type="button"
              role="listitem"
              aria-pressed={selected}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex min-h-[8rem] flex-col items-center justify-center gap-4 rounded-[1.35rem] bg-white px-1.5 py-3 transition-transform active:scale-[0.98]",
                selected
                  ? "shadow-[0_0_0_1.5px_#2d689d]"
                  : "shadow-[0_0_0_1px_#EFEFEF]"
              )}
            >
              <BrandIcon src={item.icon} alt="" className="h-[4.5rem] w-auto max-w-full" />
              <span className="text-center text-[14px] leading-tight text-[#111]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {rule ? (
        <form
          className="space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-4">
            <label htmlFor="roster-credential" className="block text-[16px] font-bold text-[#000000]">
              {fieldLabel}
            </label>
            <input
              id="roster-credential"
              ref={credentialRef}
              value={credential}
              onChange={(event) =>
                onCredentialChange(event.target.value.replace(/\D/g, "").slice(0, rule.length))
              }
              inputMode={rule.inputMode}
              placeholder={placeholder}
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

          <div className="flex w-full justify-center pt-2">
            <AppButton
              type="submit"
              loading={loading}
              disabled={!credential || !credentialValid}
              className={AUTH_BUTTON_CLASS}
            >
              {t("next")}
            </AppButton>
          </div>

          <p className="text-center text-[15px] text-[#111]">
            {dontKnowLabel}{" "}
            <AuthLink onClick={onLearnId}>{t("authHelpLearnHere")}</AuthLink>
          </p>
        </form>
      ) : selectedRole === ROLE.CITIZEN ? (
        <div className="flex w-full justify-center pt-10">
          <AppButton
            type="button"
            onClick={onContinueCitizen}
            className={AUTH_BUTTON_CLASS}
          >
            {t("next")}
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
