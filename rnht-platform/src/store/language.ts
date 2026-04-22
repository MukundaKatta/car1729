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
      // Rehydrate manually after mount via <StoreRehydrator />. Auto-rehydrate
      // would replace `locale: "en"` (SSR default) with whatever is in
      // localStorage during the first client render, which breaks hydration
      // on any Header text keyed off locale.
      skipHydration: true,
    }
  )
);
