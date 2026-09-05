"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown } from "@/components/icons";

import { AUTH_BUTTON_CLASS, AUTH_FIELD_CLASS } from "@/components/auth/AuthBrandHeader";
import { ChoiceSheet } from "@/components/auth/ChoiceSheet";
import { AppButton } from "@/components/common/AppButton";
import { GUJARAT_DISTRICTS, talukasForDistrict } from "@/data/gujarat-geo";
import { cn } from "@/lib/utils";

const FIELD_CLASS = cn(AUTH_FIELD_CLASS, "border border-[#d9d9d9]");

const DISTRICT_OPTIONS = GUJARAT_DISTRICTS.map((item) => item.name);

/** After OTP: નાગરિક fills name, then picks district and taluka. */
export function CitizenProfileStep({
  name,
  district,
  taluka,
  error,
  loading,
  onNameChange,
  onDistrictChange,
  onTalukaChange,
  onSubmit,
}) {
  const [picker, setPicker] = useState(null);
  const talukas = talukasForDistrict(district);
  const ready = Boolean(name.trim() && district.trim() && taluka.trim());

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
          <label htmlFor="citizen-name" className="block text-[16px] font-bold text-[#000000]">
            તમારું પૂરું નામ
          </label>
          <input
            id="citizen-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="આધાર કાર્ડ પ્રમાણેનું તમારું પૂરું નામ અહીં લખો"
            autoComplete="name"
            autoFocus
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-2">
          <span id="citizen-district-label" className="block text-[16px] font-bold text-[#000000]">
            જિલ્લો
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
              !district && "text-[#737373]"
            )}
          >
            <span className="min-w-0 truncate">
              {district || "તમારો જિલ્લો પસંદ કરો"}
            </span>
            <ChevronDown className="size-5 shrink-0 text-[#111]" />
          </button>
        </div>

        <div className="space-y-2">
          <span id="citizen-taluka-label" className="block text-[16px] font-bold text-[#000000]">
            તાલુકો
          </span>
          <button
            type="button"
            id="citizen-taluka"
            aria-labelledby="citizen-taluka-label"
            aria-haspopup="dialog"
            aria-expanded={picker === "taluka"}
            disabled={!district}
            onClick={() => setPicker("taluka")}
            className={cn(
              FIELD_CLASS,
              "flex items-center justify-between gap-3 text-left",
              (!district || !taluka) && "text-[#737373]",
              !district && "opacity-70"
            )}
          >
            <span className="min-w-0 truncate">
              {taluka || "તમારો તાલુકો પસંદ કરો"}
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
          Next
        </AppButton>
      </div>

      <ChoiceSheet
        open={picker === "district"}
        title="જિલ્લો પસંદ કરો"
        options={DISTRICT_OPTIONS}
        value={district}
        onSelect={(next) => {
          if (next !== district) {
            onDistrictChange(next);
            onTalukaChange("");
          }
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />

      <ChoiceSheet
        open={picker === "taluka"}
        title="તાલુકો પસંદ કરો"
        options={talukas}
        value={taluka}
        onSelect={(next) => {
          onTalukaChange(next);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </form>
  );
}
