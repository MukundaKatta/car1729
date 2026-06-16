import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_LOCATION,
  type PanchangamLocation,
} from "@/lib/panchangam";
import { browserStorage } from "@/store/persistStorage";

/**
 * Persisted user preference for the Panchangam location. Simple cities
 * are predefined; "Use current location" calls the browser geolocation
 * API and falls back to `DEFAULT_LOCATION`.
 */

type PanchangamStore = {
  location: PanchangamLocation;
  setLocation: (location: PanchangamLocation) => void;
  detectCurrentLocation: () => Promise<boolean>;
};

/** A valid IANA time zone must be accepted by Intl.DateTimeFormat without throwing. */
function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || timeZone.length === 0) return false;
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
    // Cannot verify in this environment — accept and let downstream fall back.
    return true;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * A geolocated/rehydrated location is only safe to feed into the panchangam
 * calculations and Intl formatters if its coordinates are finite and in range
 * and its time zone is a valid IANA zone.
 */
function isValidLocation(value: unknown): value is PanchangamLocation {
  if (typeof value !== "object" || value === null) return false;
  const loc = value as Partial<PanchangamLocation>;
  return (
    typeof loc.lat === "number" &&
    Number.isFinite(loc.lat) &&
    Math.abs(loc.lat) <= 90 &&
    typeof loc.lon === "number" &&
    Number.isFinite(loc.lon) &&
    Math.abs(loc.lon) <= 180 &&
    typeof loc.label === "string" &&
    loc.label.trim().length > 0 &&
    isValidTimeZone(loc.timeZone)
  );
}

export const usePanchangamStore = create<PanchangamStore>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,
      setLocation: (location) => set({ location }),
      detectCurrentLocation: async () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          return false; // geolocation unavailable — keep the current selection
        }
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude: lat, longitude: lon } = position.coords;
              // Malformed coords (emulator/spoofing tool) would propagate NaN
              // into the sunrise/sunset math and crash the widget — keep the
              // existing selection, consistent with the denial path below.
              if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon) ||
                Math.abs(lat) > 90 ||
                Math.abs(lon) > 180
              ) {
                resolve(false);
                return;
              }
              // NOTE: we use the DEVICE's time zone, which may not match the
              // geolocated coordinates (traveler on home tz, emulator, manually
              // set tz). Label it explicitly so the assumption is visible and the
              // user can override by picking a preset city.
              set({
                location: {
                  lat,
                  lon,
                  label: "Your location (device timezone)",
                  timeZone:
                    typeof Intl !== "undefined"
                      ? Intl.DateTimeFormat().resolvedOptions().timeZone
                      : DEFAULT_LOCATION.timeZone,
                },
              });
              resolve(true);
            },
            () => {
              // On denial/timeout, KEEP the user's selected location instead of
              // silently resetting it to the default city.
              resolve(false);
            },
            { enableHighAccuracy: false, timeout: 5_000 }
          );
        });
      },
    }),
    {
      name: "rnht-panchangam-location",
      storage: browserStorage,
      // Rehydrate manually via <StoreRehydrator />. The panchangam page
      // renders `location.label` on first paint, so auto-rehydrate would
      // flip the label from the default to the stored city mid-hydration.
      skipHydration: true,
      // Validate the persisted location on rehydrate. A corrupted/stale value
      // (bad lat/lon or an invalid IANA time zone from field drift) would
      // otherwise throw a RangeError in Intl during render of the home
      // panchangam scroll / /panchangam, or silently compute for bad coords.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PanchangamStore> | undefined;
        const location = isValidLocation(persisted?.location)
          ? persisted!.location
          : DEFAULT_LOCATION;
        return { ...currentState, location };
      },
    }
  )
);

export const PRESET_LOCATIONS: PanchangamLocation[] = [
  { lat: 30.6333, lon: -97.6778, label: "Georgetown, TX", timeZone: "America/Chicago" },
  { lat: 30.2672, lon: -97.7431, label: "Austin, TX", timeZone: "America/Chicago" },
  { lat: 32.7767, lon: -96.797, label: "Dallas, TX", timeZone: "America/Chicago" },
  { lat: 29.7604, lon: -95.3698, label: "Houston, TX", timeZone: "America/Chicago" },
  { lat: 37.7749, lon: -122.4194, label: "San Francisco, CA", timeZone: "America/Los_Angeles" },
  { lat: 40.7128, lon: -74.006, label: "New York, NY", timeZone: "America/New_York" },
];
