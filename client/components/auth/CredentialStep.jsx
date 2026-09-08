"use client";

import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { getCredentialRule, getRoleTabs } from "@/lib/domain/roles";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Step 1: pick a role first; the matching field appears only after that. */
export function CredentialStep({
  role,
  credential,
  error,
  loading,
  onRoleChange,
  onCredentialChange,
  onSubmit,
}) {
  const { t } = useI18n();
  const rule = role ? getCredentialRule(role) : null;
  const roleTabs = getRoleTabs();

  return (
    <form
      className="animate-screen-in space-y-6 lg:space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!rule) return;
        onSubmit();
      }}
    >
      <div className="space-y-2 text-center lg:space-y-3">
        <h2 className="text-xl font-bold text-[#111] lg:text-[1.65rem]">{t("login")}</h2>
        <p className="text-sm leading-relaxed text-[#111] lg:text-[1.02rem]">
          {t("chooseStudyType")}
        </p>
      </div>

      <div role="radiogroup" aria-label={t("login")} className="grid grid-cols-3 gap-2.5 lg:gap-4">
        {roleTabs.map((item) => {
          const active = item.id === role;

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onRoleChange(item.id)}
              className={cn(
                "flex min-h-[9.25rem] flex-col items-center justify-center gap-5 rounded-[1.35rem] bg-white px-1.5 py-3 shadow-[0_0_0_1px_#EFEFEF] transition-[box-shadow,transform] duration-200 ease-emphasized active:scale-[0.98] lg:min-h-[11.5rem] lg:rounded-[1.5rem] lg:py-5",
                active && "shadow-[0_0_0_2px_#2d689d]"
              )}
            >
              <BrandIcon src={item.icon} alt="" className="h-[4.85rem] w-auto max-w-full" />
              <span
                className={cn(
                  "mt-[-2px] text-center text-[12px] leading-tight text-[#111]",
                  active ? "font-bold" : "font-semibold"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {rule ? (
        <>
          <div className="space-y-5">
            <label htmlFor="credential" className="block translate-y-3 text-[16px] font-bold text-[#000000]">
              {rule.label}
            </label>
            <input
              id="credential"
              value={credential}
              onChange={(event) =>
                onCredentialChange(event.target.value.replace(/\D/g, "").slice(0, rule.length))
              }
              inputMode={rule.inputMode}
              placeholder={rule.hint}
              autoComplete={role === "citizen" ? "tel" : "off"}
              className={AUTH_FIELD_CLASS}
            />
          </div>

          {error ? (
            <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-12 flex w-full justify-center">
            <AppButton
              type="submit"
              loading={loading}
              disabled={!credential}
              className={AUTH_BUTTON_CLASS}
            >
              {t("next")}
            </AppButton>
          </div>
        </>
      ) : null}
    </form>
  );
}
