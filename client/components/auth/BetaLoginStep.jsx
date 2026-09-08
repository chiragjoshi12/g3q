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

export function BetaLoginStep({
  firstName,
  lastName,
  district,
  taluka,
  phone,
  error,
  loading,
  onFirstNameChange,
  onLastNameChange,
  onDistrictChange,
  onTalukaChange,
  onPhoneChange,
  onSubmit,
}) {
  const [picker, setPicker] = useState(null);
  const talukas = talukasForDistrict(district);
  const ready = Boolean(
    String(firstName).trim() &&
      String(lastName).trim() &&
      String(district).trim() &&
      String(taluka).trim() &&
      String(phone).trim()
  );

  return (
    <form
      className="animate-screen-in space-y-6 lg:space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2 text-center lg:space-y-3">
        <h2 className="text-xl font-bold text-[#111] lg:text-[1.65rem]">લોગિન કરો</h2>
        <p className="text-sm leading-relaxed text-[#111] lg:text-[1.02rem]">બીટા યુઝર માટે નીચેની વિગતો ભરો</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="beta-first-name" className="block translate-y-3 text-[16px] font-bold text-[#000000]">
            પ્રથમ નામ
          </label>
          <input
            id="beta-first-name"
            value={firstName}
            onChange={(event) => onFirstNameChange(event.target.value)}
            placeholder="પ્રથમ નામ અહીં લખો"
            autoComplete="given-name"
            autoFocus
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="beta-last-name" className="block translate-y-3 text-[16px] font-bold text-[#000000]">
            છેલ્લું નામ
          </label>
          <input
            id="beta-last-name"
            value={lastName}
            onChange={(event) => onLastNameChange(event.target.value)}
            placeholder="છેલ્લું નામ અહીં લખો"
            autoComplete="family-name"
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-2">
          <span id="beta-district-label" className="block translate-y-3 text-[16px] font-bold text-[#000000]">
            જિલ્લો
          </span>
          <button
            type="button"
            id="beta-district"
            aria-labelledby="beta-district-label"
            aria-haspopup="dialog"
            aria-expanded={picker === "district"}
            onClick={() => setPicker("district")}
            className={cn(
              FIELD_CLASS,
              "flex items-center justify-between gap-3 text-left",
              !district && "text-[#737373]"
            )}
          >
            <span className="min-w-0 truncate">{district || "તમારો જિલ્લો પસંદ કરો"}</span>
            <ChevronDown className="size-5 shrink-0 text-[#111]" />
          </button>
        </div>

        <div className="space-y-2">
          <span id="beta-taluka-label" className="block translate-y-3 text-[16px] font-bold text-[#000000]">
            તાલુકો
          </span>
          <button
            type="button"
            id="beta-taluka"
            aria-labelledby="beta-taluka-label"
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
            <span className="min-w-0 truncate">{taluka || "તમારો તાલુકો પસંદ કરો"}</span>
            <ChevronDown className="size-5 shrink-0 text-[#111]" />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="beta-phone" className="block translate-y-3 text-[16px] font-bold text-[#000000]">
            મોબાઈલ નંબર
          </label>
          <input
            id="beta-phone"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="મોબાઈલ નંબર અહીં લખો"
            autoComplete="tel"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      {error ? (
        <div className="animate-shake flex items-start gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-12 flex w-full justify-center">
        <AppButton type="submit" loading={loading} disabled={!ready} className={AUTH_BUTTON_CLASS}>
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
