"use client";

import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { CREDENTIAL, ROLE_TABS } from "@/lib/domain/roles";
import { cn } from "@/lib/utils";

/** Step 1: pick School, College, or Citizen, then enter the matching field. */
export function CredentialStep({
  role,
  credential,
  error,
  loading,
  onRoleChange,
  onCredentialChange,
  onSubmit,
}) {
  const rule = CREDENTIAL[role];

  return (
    <form
      className="animate-screen-in space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-[#111]">લોગિન કરો</h2>
        <p className="text-sm leading-relaxed text-[#111]">
          તમે શેમાં અભ્યાસ કરો છો તેના આધારે પ્રકાર પસંદ કરો
        </p>
      </div>

      <div role="radiogroup" aria-label="પ્રકાર" className="grid grid-cols-3 gap-2.5">
        {ROLE_TABS.map((item) => {
          const active = item.id === role;

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onRoleChange(item.id)}
              className={cn(
                "flex min-h-[9.25rem] flex-col items-center justify-between rounded-[1.35rem] bg-white px-1.5 py-3 transition-[box-shadow,transform] duration-200 ease-emphasized active:scale-[0.98]",
                active
                  ? "shadow-[0_0_0_2px_#2d689d]"
                  : "shadow-[0_0_0_1px_#EFEFEF]"
              )}
            >
              <BrandIcon src={item.icon} alt="" className="h-[4.85rem] w-auto max-w-full" />
              <span
                className={cn(
                  "mt-2 text-center text-[11px] leading-tight text-[#111]",
                  active ? "font-bold" : "font-semibold"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        <label htmlFor="credential" className="block text-[16px] font-bold text-[#000000]">
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
          Next
        </AppButton>
      </div>
    </form>
  );
}
