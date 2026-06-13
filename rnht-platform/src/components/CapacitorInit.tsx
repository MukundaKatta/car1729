"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Browser } from "@capacitor/browser";
import { initBackButton, openExternal, isNative } from "@/lib/capacitor";
import { useAuthStore } from "@/store/auth";

/**
 * Initializes Capacitor-specific functionality:
 * - Android hardware back button navigation
 * - Intercepts ALL external link clicks to open in system browser (not WebView)
 *   This handles WhatsApp, social media, Google Calendar, etc.
 */
export function CapacitorInit() {
  const router = useRouter();

  useEffect(() => {
    const cleanup = initBackButton(() => router.back());

    // On native: intercept all external link clicks and open in system browser
    if (!isNative()) return cleanup;

    // iOS renders edge-to-edge: the status bar sits over the cream header, so
    // it needs DARK icons (Style.Light = dark content). Android keeps the
    // config default (light icons on the maroon bar).
    if (Capacitor.getPlatform() === "ios") {
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    }

    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only intercept external links (http/https) and special protocols (wa.me, tel won't match)
      if (href.startsWith("http://") || href.startsWith("https://")) {
        // Don't intercept internal navigation (same origin)
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin === window.location.origin) return;
        } catch {
          // Invalid URL, let it pass
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        openExternal(href);
      }
    };

    document.addEventListener("click", handleLinkClick, true);

    // When the in-app payment browser closes (donor returns from Stripe/PayPal),
    // refresh their data so a just-completed donation shows in the dashboard.
    const browserListener = Browser.addListener("browserFinished", () => {
      const { isAuthenticated, fetchUserData } = useAuthStore.getState();
      if (isAuthenticated) void fetchUserData();
    });

    return () => {
      cleanup?.();
      document.removeEventListener("click", handleLinkClick, true);
      browserListener.then((l) => l.remove());
    };
  }, [router]);

  return null;
}
