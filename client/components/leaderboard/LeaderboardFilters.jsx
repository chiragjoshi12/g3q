"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { ChoiceSheet } from "@/components/auth/ChoiceSheet";
import { SheetCloseButton } from "@/components/common/SheetCloseButton";
import { ChevronDown } from "@/components/icons";
import { DESKTOP_OVERLAY, DESKTOP_OVERLAY_CARD } from "@/components/layout/desktop-overlay";
import { PLATFORM_WEEKS } from "@/config/platformWeeks";
import { formatWeekChipLabel, formatWeekLabel } from "@/lib/domain/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function FilterChip({ label, placeholder, onClick, className }) {
  const empty = !label;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mt-2 inline-flex w-fit max-w-full flex-nowrap items-center gap-1 rounded-[0.8rem] border-[0.5px] border-[#737373] px-3.5 py-2 text-left transition-colors active:bg-[#FAFAFA]",
        className
      )}
    >
      <span
        className={cn(
          "max-w-[9.5rem] truncate text-[15px] font-medium leading-[1.45] sm:max-w-[13rem]",
          empty ? "text-[#737373]" : "text-[#111]"
        )}
      >
        {label || placeholder}
      </span>
      <ChevronDown className="size-5 shrink-0 text-[#667085]" strokeWidth={2.25} />
    </button>
  );
}

function LocationSelectRow({ label, placeholder, onClick, disabled = false }) {
  const empty = !label;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full h-[60px] items-center justify-between gap-3 rounded-[1.3rem] border border-[#d9d9d9] bg-white px-5 py-4 text-left transition-colors active:bg-[#FAFAFA] disabled:opacity-55",
        empty ? "text-[#737373]" : "text-[#111]"
      )}
    >
      <span className="truncate text-[16px] font-medium leading-snug text-[#111]">
        {label || placeholder}
      </span>
      <ChevronDown className="size-5 shrink-0 text-[#98A2B3]" strokeWidth={2.25} />
    </button>
  );
}

function placeLabel(entry, language) {
  if (!entry) return "";
  if (language === "en") return entry.nameEn || entry.name || entry.nameGu || "";
  if (language === "hi") return entry.nameHi || entry.name || entry.nameEn || entry.nameGu || "";
  return entry.nameGu || entry.name || entry.nameEn || "";
}

/**
 * District + taluka picker sheet. Values are geography ids from `/api/geography/districts`.
 */
export function LeaderboardLocationSheet({
  open,
  districts = [],
  districtId,
  talukaId,
  onDistrictChange,
  onTalukaChange,
  onClose,
  dismissible = true,
}) {
  const { language, t } = useI18n();
  const [picker, setPicker] = useState(null);
  const [districtFirstHint, setDistrictFirstHint] = useState(false);
  const frame = typeof document === "undefined" ? null : document.querySelector("[data-app-frame]");

  const selectedDistrict = useMemo(
    () => districts.find((item) => Number(item.id) === Number(districtId)) || null,
    [districts, districtId]
  );
  const selectedTaluka = useMemo(
    () =>
      (selectedDistrict?.talukas || []).find((item) => Number(item.id) === Number(talukaId)) ||
      null,
    [selectedDistrict, talukaId]
  );

  const districtOptions = useMemo(
    () =>
      districts.map((item) => ({
        value: String(item.id),
        label: placeLabel(item, language),
      })),
    [districts, language]
  );
  const talukaOptions = useMemo(
    () =>
      (selectedDistrict?.talukas || []).map((item) => ({
        value: String(item.id),
        label: placeLabel(item, language),
      })),
    [selectedDistrict, language]
  );

  useEffect(() => {
    if (!open) {
      setPicker(null);
      setDistrictFirstHint(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (picker) {
        setPicker(null);
        return;
      }
      if (dismissible) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, picker, dismissible]);

  if (!open || !frame) return null;

  return createPortal(
    <div className={DESKTOP_OVERLAY}>
      {dismissible ? (
        <button
          type="button"
          aria-label={t("close")}
          onClick={onClose}
          className="absolute inset-0 bg-black/35"
        />
      ) : (
        <div className="absolute inset-0 bg-black/35" />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-location-title"
        className={cn(
          "animate-slide-up relative flex w-full flex-col overflow-hidden rounded-t-[2.25rem] bg-white px-6 pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-m3",
          DESKTOP_OVERLAY_CARD,
          "lg:w-[min(28rem,90vw)]"
        )}
      >
        <SheetCloseButton onClick={onClose} />
        <div className="relative flex items-start justify-center">
          <h3
            id="leaderboard-location-title"
            className="px-10 text-center text-[16px] leading-snug text-[#000000]"
          >
            {t("leaderboardLocationHint")}
          </h3>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div>
            <LocationSelectRow
              label={placeLabel(selectedDistrict, language)}
              placeholder={t("selectDistrictTitle")}
              onClick={() => {
                setDistrictFirstHint(false);
                setPicker("district");
              }}
            />
            {districtFirstHint ? (
              <p className="mt-1.5 px-1 text-[12px] font-medium leading-snug text-[#DC2626]">
                {t("selectDistrictFirst")}
              </p>
            ) : null}
          </div>
          <LocationSelectRow
            label={placeLabel(selectedTaluka, language)}
            placeholder={t("selectTalukaTitle")}
            onClick={() => {
              if (!districtId) {
                setDistrictFirstHint(true);
                return;
              }
              setDistrictFirstHint(false);
              setPicker("taluka");
            }}
          />
        </div>
      </div>

      <ChoiceSheet
        open={picker === "district"}
        title={t("selectDistrictTitle")}
        options={districtOptions}
        value={districtId != null ? String(districtId) : ""}
        onSelect={(next) => {
          onDistrictChange?.(Number(next));
          setDistrictFirstHint(false);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <ChoiceSheet
        open={picker === "taluka"}
        title={t("selectTalukaTitle")}
        options={talukaOptions}
        value={talukaId != null ? String(talukaId) : ""}
        onSelect={(next) => {
          onTalukaChange?.(Number(next));
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </div>,
    frame
  );
}

export function LeaderboardWeekChip({ week, onClick, className }) {
  const { language } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex max-w-[10.5rem] items-center gap-1.5 rounded-[0.8rem] bg-[#ECEFF3] px-3.5 py-2 text-[13px] font-semibold text-[#111] transition-colors active:bg-[#E2E6EC]",
        className
      )}
    >
      <span className="truncate leading-[1.45]">{formatWeekChipLabel(week, language)}</span>
      <ChevronDown className="size-5 shrink-0 text-[#667085]" strokeWidth={2.5} />
    </button>
  );
}

export function LeaderboardFilterBar({
  districtLabel,
  talukaLabel,
  onDistrictClick,
  onTalukaClick,
  className,
}) {
  const { t } = useI18n();
  const [districtFirstHint, setDistrictFirstHint] = useState(false);
  const hasDistrict = Boolean(districtLabel);

  useEffect(() => {
    if (hasDistrict) setDistrictFirstHint(false);
  }, [hasDistrict]);

  return (
    <div className={cn("flex flex-wrap items-start gap-3 lg:translate-x-4", className)}>
      <div className="min-w-0">
        <FilterChip
          label={districtLabel || ""}
          placeholder={t("district")}
          onClick={() => {
            setDistrictFirstHint(false);
            onDistrictClick?.();
          }}
        />
        {districtFirstHint ? (
          <p className="mt-1.5 max-w-[12rem] px-1 text-[12px] font-medium leading-snug text-[#DC2626]">
            {t("selectDistrictFirst")}
          </p>
        ) : null}
      </div>
      <FilterChip
        label={talukaLabel || ""}
        placeholder={t("taluka")}
        onClick={() => {
          if (!hasDistrict) {
            setDistrictFirstHint(true);
            return;
          }
          setDistrictFirstHint(false);
          onTalukaClick?.();
        }}
      />
    </div>
  );
}

export function LeaderboardWeekSheet({ open, week, weeks = PLATFORM_WEEKS, onSelect, onClose }) {
  const { language, t } = useI18n();
  const options = (weeks?.length ? weeks : PLATFORM_WEEKS).map((item) => ({
    value: String(item.id),
    label: formatWeekLabel(item.id, language),
  }));

  return (
    <ChoiceSheet
      open={open}
      title={t("selectWeekTitle")}
      options={options}
      value={String(week)}
      onSelect={(next) => onSelect?.(Number(next))}
      onClose={onClose}
    />
  );
}
