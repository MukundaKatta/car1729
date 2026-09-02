import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { handleOverlayBack } from "./overlay-stack";

/**
 * Open a URL in the system browser (on native) or new tab (on web).
 * Use this for ALL external links: WhatsApp, social media, Google Calendar, etc.
 */
export async function openExternal(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Check if running inside a native Capacitor app.
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Which shell the page is running in: "ios" / "android" inside the native
 * Capacitor apps, "web" in a browser. Lets features the WebViews can't do
 * (e.g. file downloads) pick a per-platform fallback.
 */
export function nativePlatform(): "ios" | "android" | "web" {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
}

/**
 * Initialize Android back button handler.
 * Call this once in the root layout.
 */
export function initBackButton(onBack: () => void): (() => void) | undefined {
  if (!Capacitor.isNativePlatform()) return undefined;

  const listener = App.addListener("backButton", ({ canGoBack }) => {
    // Close any open overlay (mobile menu, modal, lightbox) first, so back
    // dismisses it instead of navigating away or exiting the app.
    if (handleOverlayBack()) return;
    if (canGoBack) {
      onBack();
    } else {
      App.exitApp();
    }
  });

  return () => {
    listener.then((l) => l.remove());
  };
}
