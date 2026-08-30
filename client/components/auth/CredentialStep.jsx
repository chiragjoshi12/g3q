"use client";

import { AlertCircle } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { AppButton } from "@/components/common/AppButton";
import { CREDENTIAL, ROLE_TABS } from "@/lib/domain/roles";
import { cn } from "@/lib/utils";

/** Step 1: pick Student or College, then enter the matching code. */
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
  const activeIndex = Math.max(
    0,
    ROLE_TABS.findIndex((item) => item.id === role)
  );

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
          તમે શેમા અભ્યાસ કરો છો તેના આધારે પ્રકાર પસંદ કરો.
        </p>
      </div>

      <div
        role="tablist"
        className="relative grid h-15 w-full grid-cols-2 rounded-[1.5rem] bg-[linear-gradient(90deg,#f6f5f3,#edf5f2)] p-1 shadow-[0_0_0_1px_#EFEFEF]"
      >
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-[1.25rem] bg-white transition-transform duration-300 ease-emphasized"
          style={{
            width: "calc((100% - 0.5rem) / 2)",
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {ROLE_TABS.map((item) => {
          const active = item.id === role;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onRoleChange(item.id)}
              className={cn(
                "relative z-10 rounded-[1.25rem] text-sm font-semibold",
                active ? "text-[#111]" : "text-[#6B7280]"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor="credential" className="block text-sm font-bold text-[#111]">
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
          autoComplete="off"
          className={AUTH_FIELD_CLASS}
        />
      </div>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex w-full justify-center">
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
