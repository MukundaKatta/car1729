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
  detectCurrentLocation: () => Promise<void>;
};

export const usePanchangamStore = create<PanchangamStore>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,
      setLocation: (location) => set({ location }),
      detectCurrentLocation: async () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          set({ location: DEFAULT_LOCATION });
          return;
        }
        return new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude: lat, longitude: lon } = position.coords;
              set({
                location: {
                  lat,
                  lon,
                  label: "Your location",
                  timeZone:
                    typeof Intl !== "undefined"
                      ? Intl.DateTimeFormat().resolvedOptions().timeZone
                      : DEFAULT_LOCATION.timeZone,
                },
              });
              resolve();
            },
            () => {
              set({ location: DEFAULT_LOCATION });
              resolve();
            },
            { enableHighAccuracy: false, timeout: 5_000 }
          );
        });
      },
    }),
    {
      name: "rnht-panchangam-location",
      storage: browserStorage,
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
