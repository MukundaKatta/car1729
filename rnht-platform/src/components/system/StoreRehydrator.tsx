"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/store/language";
import { useCartStore } from "@/store/cart";
import { usePanchangamStore } from "@/store/panchangam";
import { useAuthStore } from "@/store/auth";

/**
 * Rehydrate Zustand persist stores after mount.
 *
 * The language, cart, and panchangam stores set `skipHydration: true` so
 * the first client render always matches the SSR defaults. We then call
 * `.persist.rehydrate()` here to pull the stored values in after
 * hydration completes — no more React #425 on the Header.
 *
 * Also initialize auth once, globally, so the Header reflects the signed-in
 * state on every page (previously only /dashboard, /profile, /login called it,
 * so the header showed "signed out" everywhere else). initialize() is
 * idempotent and guards against duplicate auth listeners.
 */
export function StoreRehydrator() {
  const locale = useLanguageStore((s) => s.locale);

  useEffect(() => {
    // `.persist` is undefined when tests mock these stores without the
    // persist middleware — guard so a mocked store doesn't crash the layout.
    //
    // `rehydrate()` returns a Promise that rejects if the stored JSON is
    // corrupted; swallow the rejection so it doesn't surface as an unhandled
    // rejection (console noise / dev overlay). The store keeps its SSR
    // defaults when rehydration fails, which is the correct fallback.
    void Promise.resolve(useLanguageStore.persist?.rehydrate?.()).catch(() => {});
    void Promise.resolve(useCartStore.persist?.rehydrate?.()).catch(() => {});
    void Promise.resolve(usePanchangamStore.persist?.rehydrate?.()).catch(() => {});
    // Promise.resolve() so a mocked initialize() that returns undefined (tests)
    // doesn't throw on .catch.
    void Promise.resolve(useAuthStore.getState().initialize()).catch(() => {});
  }, []);

  // Keep <html lang> in sync with the selected language so screen readers /
  // TTS / "translate this page" use the correct language (layout renders the
  // static lang="en" default; this updates it after rehydrate + on switch).
  // Only ~5% of the UI is translated today, so <html lang> stays "en": marking
  // an English page as Telugu/Hindi makes screen readers and auto-translate
  // mangle it. Flip this back to `locale` once the pages are actually localised.
  useEffect(() => {
    if (typeof document !== "undefined" && locale) {
      document.documentElement.lang = "en";
    }
  }, [locale]);

  return null;
}
