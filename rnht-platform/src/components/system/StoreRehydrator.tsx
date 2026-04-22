"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/store/language";
import { useCartStore } from "@/store/cart";
import { usePanchangamStore } from "@/store/panchangam";

/**
 * Rehydrate Zustand persist stores after mount.
 *
 * The language, cart, and panchangam stores set `skipHydration: true` so
 * the first client render always matches the SSR defaults. We then call
 * `.persist.rehydrate()` here to pull the stored values in after
 * hydration completes — no more React #425 on the Header.
 */
export function StoreRehydrator() {
  useEffect(() => {
    // `.persist` is undefined when tests mock these stores without the
    // persist middleware — guard so a mocked store doesn't crash the layout.
    useLanguageStore.persist?.rehydrate?.();
    useCartStore.persist?.rehydrate?.();
    usePanchangamStore.persist?.rehydrate?.();
  }, []);
  return null;
}
