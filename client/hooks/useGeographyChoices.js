"use client";

import { useEffect, useMemo, useState } from "react";

import { getDataSource } from "@/lib/data/sources";
import {
  districtChoiceOptions,
  localizePlaceName,
  talukaChoiceOptions,
} from "@/lib/localize-place";

/**
 * Prefer live `/api/geography/districts` (IDs for FK registration).
 * Fall back to static Gujarati name values when the API is unavailable.
 */
export function useGeographyChoices(language) {
  const [districts, setDistricts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const source = getDataSource();
    if (typeof source.getGeographyDistricts !== "function") {
      setDistricts(null);
      return undefined;
    }

    source
      .getGeographyDistricts({ lang: language })
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray(payload?.districts) ? payload.districts : [];
        setDistricts(list.length ? list : null);
      })
      .catch(() => {
        if (!cancelled) setDistricts(null);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  return useMemo(() => {
    if (districts?.length) {
      return {
        mode: "id",
        districtOptions: districts.map((d) => ({
          value: String(d.id),
          label: d.name || d.nameGu || d.nameEn || String(d.id),
          nameGu: d.nameGu || d.name || "",
        })),
        talukaOptionsFor: (districtId) => {
          const district = districts.find((d) => String(d.id) === String(districtId));
          return (district?.talukas || []).map((t) => ({
            value: String(t.id),
            label: t.name || t.nameGu || t.nameEn || String(t.id),
            nameGu: t.nameGu || t.name || "",
          }));
        },
        labelForDistrict: (districtId) => {
          const district = districts.find((d) => String(d.id) === String(districtId));
          return district?.name || district?.nameGu || "";
        },
        labelForTaluka: (districtId, talukaId) => {
          const district = districts.find((d) => String(d.id) === String(districtId));
          const taluka = (district?.talukas || []).find((t) => String(t.id) === String(talukaId));
          return taluka?.name || taluka?.nameGu || "";
        },
        nameGuForDistrict: (districtId) => {
          const district = districts.find((d) => String(d.id) === String(districtId));
          return district?.nameGu || district?.name || "";
        },
        nameGuForTaluka: (districtId, talukaId) => {
          const district = districts.find((d) => String(d.id) === String(districtId));
          const taluka = (district?.talukas || []).find((t) => String(t.id) === String(talukaId));
          return taluka?.nameGu || taluka?.name || "";
        },
      };
    }

    return {
      mode: "name",
      districtOptions: districtChoiceOptions(language),
      talukaOptionsFor: (districtName) => talukaChoiceOptions(districtName, language),
      labelForDistrict: (districtName) => localizePlaceName(districtName, language),
      labelForTaluka: (districtName, talukaName) =>
        localizePlaceName(talukaName, language, { districtName }),
      nameGuForDistrict: (districtName) => String(districtName || ""),
      nameGuForTaluka: (_districtName, talukaName) => String(talukaName || ""),
    };
  }, [districts, language]);
}
