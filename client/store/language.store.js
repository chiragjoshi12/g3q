"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_LANGUAGE } from "@/config/languages";
import { STORAGE_KEYS, storage, zustandStorage } from "@/lib/storage/storage";

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
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          storage.set(STORAGE_KEYS.languagePreference, state.language);
        }
      },
    }
  )
);
