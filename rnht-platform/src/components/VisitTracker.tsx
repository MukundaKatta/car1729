"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isNative } from "@/lib/capacitor";

/**
 * Visitor counter for the admin dashboard (migration 015_site_visits).
 *
 * Logs one visit per browser session through the record_visit() RPC, keyed by
 * a random per-device id: no IP, user agent or user id leaves the device, and
 * the server keeps at most one row per visitor per hour. Everything here is
 * best-effort: it never throws, never blocks render, and treats storage that
 * is unavailable (private mode) as "not logged yet".
 */

const SESSION_KEY = "rnht_visit_logged";
const VISITOR_KEY = "rnht_vid";

/** 36-char UUID-shaped id; crypto.randomUUID is missing in older WebViews / non-secure contexts. */
function newVisitorId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the Math.random fallback
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r % 4) + 8).toString(16);
  });
}

function getVisitorId(): string {
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored && stored.length >= 8 && stored.length <= 64) return stored;
  } catch {
    // storage blocked: fall through to a fresh id
  }
  const id = newVisitorId();
  try {
    window.localStorage.setItem(VISITOR_KEY, id);
  } catch {
    // storage blocked: the id lives for this page load only
  }
  return id;
}

function recordVisit(): void {
  try {
    if (typeof window === "undefined" || !supabase) return;
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // storage blocked: cannot tell, so log it (the server dedupes per hour)
    }
    // Mark before the request so a StrictMode double-effect or a slow network
    // cannot fire it twice.
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // storage blocked
    }
    Promise.resolve(
      supabase.rpc("record_visit", {
        p_visitor: getVisitorId(),
        p_path: path,
        p_platform: isNative() ? "app" : "web",
      })
    )
      .then(({ error }) => {
        if (error) console.debug("Visit not recorded:", error.message);
      })
      .catch((e) => console.debug("Visit not recorded:", e));
  } catch (e) {
    console.debug("Visit tracker skipped:", e);
  }
}

/** Mount once in the root layout. Renders nothing. */
export function VisitTracker() {
  useEffect(() => {
    recordVisit();
  }, []);
  return null;
}
