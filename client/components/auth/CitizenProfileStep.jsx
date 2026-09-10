"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { ChoiceSheet } from "@/components/auth/ChoiceSheet";
import { AppButton } from "@/components/common/AppButton";
import { useGeographyChoices } from "@/hooks/useGeographyChoices";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const FIELD_CLASS = cn(AUTH_FIELD_CLASS, "border border-[#d9d9d9]");

/** After OTP: નાગરિક fills name, then picks district and taluka. */
export function CitizenProfileStep({
  name,
  district,
  taluka,
  districtId,
  talukaId,
  error,
  loading,
  onNameChange,
  onDistrictChange,
  onTalukaChange,
  onSubmit,
}) {
  const { t, language } = useI18n();
  const [picker, setPicker] = useState(null);
  const geo = useGeographyChoices(language);
  const selectedDistrict = geo.mode === "id" ? districtId : district;
  const selectedTaluka = geo.mode === "id" ? talukaId : taluka;
  const districtOptions = geo.districtOptions;
  const talukaOptions = geo.talukaOptionsFor(selectedDistrict);
  const ready = Boolean(
    name.trim() &&
      (geo.mode === "id"
        ? districtId != null && talukaId != null
        : district.trim() && taluka.trim())
  );

  return (
    <form
      className="animate-screen-in space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="citizen-name" className="block text-[16px] font-bold text-[#000000] translate-y-3">
            {t("yourFullName")}
          </label>
          <input
            id="citizen-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t("yourFullName")}
            autoComplete="name"
            autoFocus
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-2">
          <span id="citizen-district-label" className="block text-[16px] font-bold text-[#000000] translate-y-3">
            {t("district")}
          </span>
          <button
            type="button"
            id="citizen-district"
            aria-labelledby="citizen-district-label"
            aria-haspopup="dialog"
            aria-expanded={picker === "district"}
            onClick={() => setPicker("district")}
            className={cn(
              FIELD_CLASS,
              "flex items-center justify-between gap-3 text-left",
              !selectedDistrict && "text-[#737373]"
            )}
          >
            <span className="min-w-0 truncate">
              {selectedDistrict
                ? geo.labelForDistrict(selectedDistrict)
                : t("selectDistrict")}
            </span>
            <ChevronDown className="size-5 shrink-0 text-[#111]" />
          </button>
        </div>

        <div className="space-y-2">
          <span id="citizen-taluka-label" className="block text-[16px] font-bold text-[#000000] translate-y-3">
            {t("taluka")}
          </span>
          <button
            type="button"
            id="citizen-taluka"
            aria-labelledby="citizen-taluka-label"
            aria-haspopup="dialog"
            aria-expanded={picker === "taluka"}
            disabled={!selectedDistrict}
            onClick={() => setPicker("taluka")}
            className={cn(
              FIELD_CLASS,
              "flex items-center justify-between gap-3 text-left",
              (!selectedDistrict || !selectedTaluka) && "text-[#737373]",
              !selectedDistrict && "opacity-70"
            )}
          >
            <span className="min-w-0 truncate">
              {selectedTaluka
                ? geo.labelForTaluka(selectedDistrict, selectedTaluka)
                : t("selectTaluka")}
            </span>
            <ChevronDown className="size-5 shrink-0 text-[#111]" />
          </button>
        </div>
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
          disabled={!ready}
          className={AUTH_BUTTON_CLASS}
        >
          {t("next")}
        </AppButton>
      </div>

      <ChoiceSheet
        open={picker === "district"}
        title={t("selectDistrictTitle")}
        options={districtOptions}
        value={selectedDistrict != null ? String(selectedDistrict) : ""}
        onSelect={(next) => {
          if (geo.mode === "id") {
            onDistrictChange(geo.nameGuForDistrict(next), Number(next));
          } else {
            onDistrictChange(next, null);
          }
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />

      <ChoiceSheet
        open={picker === "taluka"}
        title={t("selectTalukaTitle")}
        options={talukaOptions}
        value={selectedTaluka != null ? String(selectedTaluka) : ""}
        onSelect={(next) => {
          if (geo.mode === "id") {
            onTalukaChange(geo.nameGuForTaluka(selectedDistrict, next), Number(next));
          } else {
            onTalukaChange(next, null);
          }
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </form>
  );
}
