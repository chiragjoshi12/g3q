"use client";

import { LanguageSelectionScreen } from "@/components/landing/LanguageSelectionScreen";
import { WelcomeScreen } from "@/components/landing/WelcomeScreen";
import { AppShell } from "@/components/layout/AppShell";
import { LANGUAGE_INFO } from "@/config/languages";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { STORAGE_KEYS, storage } from "@/lib/storage/storage";
import { useLanguageStore } from "@/store/language.store";

function hasSavedLanguagePreference() {
  const saved = storage.get(STORAGE_KEYS.languagePreference, null);
  return Boolean(saved && LANGUAGE_INFO[saved]);
}

export default function RootPage() {
  const hydrated = useStoreHydrated(useLanguageStore);
  const hasChosenLanguage = useLanguageStore((state) => state.hasChosenLanguage);

  if (!hydrated) {
    return (
      <AppShell
        fullOnDesktop
        className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F7F7F7] lg:bg-transparent"
      />
    );
  }

  if (!hasChosenLanguage && !hasSavedLanguagePreference()) return <LanguageSelectionScreen />;
  return <WelcomeScreen />;
}
