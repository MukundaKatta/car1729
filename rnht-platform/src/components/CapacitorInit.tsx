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

      // Only intercept external links (http/https). tel:/mailto:/whatsapp: etc.
      // don't match this prefix check and are left for the OS to resolve.
      if (href.startsWith("http://") || href.startsWith("https://")) {
        let url: URL;
        // Don't intercept internal navigation (same origin)
        try {
          url = new URL(href, window.location.origin);
          if (url.origin === window.location.origin) return;
        } catch {
          // Invalid URL, let it pass
          return;
        }

        // WhatsApp deep links (wa.me / api.whatsapp.com) are https URLs, but
        // routing them through the in-app Browser (SFSafariViewController /
        // Custom Tab) lands the user on WhatsApp's "Continue to Chat" web
        // interstitial instead of the installed WhatsApp app. Hand these to the
        // OS via "_system" so it resolves the app link straight into WhatsApp.
        const host = url.hostname.replace(/^www\./, "");
        if (host === "wa.me" || host === "api.whatsapp.com") {
          e.preventDefault();
          window.open(href, "_system");
          return;
        }

        // preventDefault stops the in-webview navigation so we can open the link
        // in the system browser instead. We deliberately do NOT stopPropagation:
        // this is a capture-phase listener, and stopping propagation would also
        // swallow React's own onClick on the same anchor (e.g. the handler that
        // closes the mobile menu), leaving the menu stuck open after a tap on an
        // external link (WhatsApp, socials).
        e.preventDefault();
        openExternal(href);
      }
    };

    document.addEventListener("click", handleLinkClick, true);

    // When the in-app payment browser closes (donor returns from Stripe/PayPal),
    // refresh their data so a just-completed donation shows in the dashboard.
    // Await the listener handle and guard against a fast unmount so the
    // resolved listener can't leak after cleanup runs.
    let browserListenerCancelled = false;
    let browserListenerHandle: { remove: () => void } | null = null;
    void (async () => {
      const listener = await Browser.addListener("browserFinished", () => {
        // Re-assert the iOS status-bar style: the in-app payment browser
        // (Stripe/PayPal) can leave the status bar in its own style, so restore
        // the temple's dark-icon style (Style.Light) when the donor returns.
        if (Capacitor.getPlatform() === "ios") {
          StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        }
        const { isAuthenticated, fetchUserData } = useAuthStore.getState();
        // fetchUserData awaits Supabase queries; a hard network failure on
        // return from the payment browser can reject the promise. Swallow it so
        // it doesn't surface as an unhandled rejection in the WebView.
        if (isAuthenticated) void fetchUserData().catch(() => {});
      });
      if (browserListenerCancelled) listener.remove();
      else browserListenerHandle = listener;
    })();

    return () => {
      cleanup?.();
      document.removeEventListener("click", handleLinkClick, true);
      browserListenerCancelled = true;
      browserListenerHandle?.remove();
    };
  }, [router]);

  return null;
}
