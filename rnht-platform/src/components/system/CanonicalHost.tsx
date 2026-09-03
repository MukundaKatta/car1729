"use client";

import { useEffect } from "react";
import { SITE_URL } from "@/lib/site-metadata";

/**
 * Hosts that serve a byte-identical copy of the site (Firebase default hosts,
 * the www alias). Browsers landing there are sent to the canonical origin so
 * search engines, shared links and the visitor counter all see one site.
 * The native apps run from capacitor://localhost / http://localhost and are
 * never redirected; neither is any host outside this list (previews, mirrors).
 */
const DUPLICATE_HOSTS = new Set([
  "www.rnht.org",
  "rnht-platform.web.app",
  "rnht-platform.firebaseapp.com",
]);

/** Returns the canonical URL to replace `href` with, or null to stay put. */
export function canonicalRedirectTarget(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!DUPLICATE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const canonical = new URL(SITE_URL);
  if (url.hostname.toLowerCase() === canonical.hostname) return null;
  return `${canonical.origin}${url.pathname}${url.search}${url.hash}`;
}

/** Mount once in the root layout. Renders nothing. */
export function CanonicalHost() {
  useEffect(() => {
    try {
      const target = canonicalRedirectTarget(window.location.href);
      if (target) window.location.replace(target);
    } catch {
      // never block rendering over a redirect
    }
  }, []);
  return null;
}
