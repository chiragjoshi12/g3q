"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_LANGUAGE, LANGUAGE_INFO } from "@/config/languages";
import { STORAGE_KEYS, storage, zustandStorage } from "@/lib/storage/storage";

function readStoredLanguage() {
  const saved = storage.get(STORAGE_KEYS.languagePreference, null);
  return saved && LANGUAGE_INFO[saved] ? saved : null;
}

export const useLanguageStore = create()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      hasChosenLanguage: false,
      setLanguage: (language) => {
        storage.set(STORAGE_KEYS.languagePreference, language);
        set({ language, hasChosenLanguage: true });
      },
      clearLanguageChoice: () => set({ hasChosenLanguage: false }),
    }),
    {
      name: STORAGE_KEYS.language,
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      migrate: (persisted) => ({
        ...persisted,
        hasChosenLanguage: persisted.hasChosenLanguage ?? true,
      }),
      merge: (persisted, current) => {
        const saved = readStoredLanguage();
        const next = { ...current, ...(persisted || {}) };
        if (saved) {
          next.hasChosenLanguage = true;
          if (!LANGUAGE_INFO[next.language]) next.language = saved;
        }
        return next;
      },
      onRehydrateStorage: () => (state) => {
        const saved = readStoredLanguage();
        if (saved && state && !state.hasChosenLanguage) {
          useLanguageStore.setState({ hasChosenLanguage: true, language: state.language || saved });
        }
        if (state?.hasChosenLanguage && state.language) {
          storage.set(STORAGE_KEYS.languagePreference, state.language);
        }
      },
    }
  )
);
