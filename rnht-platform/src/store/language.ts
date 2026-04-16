import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/i18n/translations";
import { browserStorage } from "@/store/persistStorage";

type LanguageStore = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "rnht-language",
      storage: browserStorage,
    }
  )
);
