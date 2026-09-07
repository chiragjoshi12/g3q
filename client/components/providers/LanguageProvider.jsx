"use client";

import { useEffect } from "react";

import { getLanguageMeta } from "@/lib/i18n";
import { useLanguageStore } from "@/store/language.store";

export function LanguageProvider({ children }) {
  const language = useLanguageStore((state) => state.language);

  useEffect(() => {
    const html = document.documentElement;
    const meta = getLanguageMeta(language);
    html.lang = meta.htmlLang;
  }, [language]);

  return children;
}
