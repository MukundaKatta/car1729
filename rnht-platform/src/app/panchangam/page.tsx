"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { PanchangamWidget } from "@/components/panchangam/PanchangamWidget";
import {
  computePanchangam,
  createPanchangamLoadingState,
  type ComputedPanchangam,
} from "@/lib/panchangam";
import { usePanchangamStore, PRESET_LOCATIONS } from "@/store/panchangam";

export default function PanchangamPage() {
  const location = usePanchangamStore((s) => s.location);
  const setLocation = usePanchangamStore((s) => s.setLocation);
  const detectCurrentLocation = usePanchangamStore((s) => s.detectCurrentLocation);
  const [computed, setComputed] = useState<ComputedPanchangam>(() =>
    // null date -> no today's-date baked into the static HTML (avoids the
    // build-vs-view-day hydration mismatch). The real date arrives via useEffect.
    createPanchangamLoadingState(location, null)
  );
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  // Geolocation is requested ONLY when the devotee taps "Use current location"
  // (see the button below) — never automatically on mount. Auto-prompting was
  // both a privacy concern and, on iOS, required a usage-description string;
  // the page falls back to DEFAULT_LOCATION (Austin, TX) until the user opts in.

  // Tracks the latest in-flight load so stale async results (e.g. a location
  // change that lands after a background refresh) can be discarded.
  const loadIdRef = useRef(0);

  // `silent` recomputes in the background without flashing the loading state —
  // used by the auto-refresh paths (timer / focus / visibility) so an already-
  // rendered almanac is not blanked out while the new values are computed.
  const loadPanchangam = useCallback(
    async (silent = false) => {
      const loadId = ++loadIdRef.current;

      if (!silent) {
        setLoading(true);
        setHasError(false);
        setComputed(createPanchangamLoadingState(location));
      }

      try {
        const data = await computePanchangam(location);
        if (loadId === loadIdRef.current) {
          setComputed(data);
          setHasError(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load live Panchangam", error);
        if (loadId === loadIdRef.current) {
          if (!silent) {
            setComputed(createPanchangamLoadingState(location));
            setHasError(true);
          }
          setLoading(false);
        }
      }
    },
    [location]
  );

  // Recompute when the location changes (with the visible loading state).
  useEffect(() => {
    loadPanchangam(false);
  }, [loadPanchangam]);

  // Keep the almanac fresh while the page stays open: refresh periodically and
  // whenever the tab regains focus/visibility. Without this the tithi /
  // nakshatra / vaara computed at page-load instant go stale across a tithi
  // boundary or across local midnight. Refreshes are silent so the rendered
  // values are not blanked out mid-view.
  useEffect(() => {
    const REFRESH_MS = 5 * 60 * 1000; // every 5 minutes
    const interval = setInterval(() => loadPanchangam(true), REFRESH_MS);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        loadPanchangam(true);
      }
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loadPanchangam]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="section-heading">Daily Panchangam</h1>
        <p className="mt-3 text-gray-600">
          Your daily Hindu almanac with Tithi, Nakshatra, Yoga, Karana, and
          auspicious/inauspicious timings, localized to your chosen location.
        </p>
      </div>

      {/* Panchangam Shloka — wide sacred verse (main box) flanked by two
          separate info boxes: What is Panchangam? | Shloka | Understanding Timings */}
      <div className="mt-8 grid gap-6 lg:grid-cols-4 lg:items-stretch">
        {/* Left box (outside the main box) — What is Panchangam? */}
        <div className="order-2 rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-premium lg:order-1">
          <h2 className="font-heading text-lg font-bold text-temple-maroon">
            What is Panchangam?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Panchangam (Panchanga) is a Hindu calendar and almanac that tracks
            five key attributes of each day: <strong>Tithi</strong> (lunar day),{" "}
            <strong>Vaara</strong> (weekday), <strong>Nakshatra</strong> (lunar
            mansion), <strong>Yoga</strong> (luni-solar day), and{" "}
            <strong>Karana</strong> (half of Tithi). It is essential for
            determining auspicious times for rituals, ceremonies, and important
            activities.
          </p>
        </div>

        {/* Middle (main box) — Sanskrit shloka on parchment, expanded width */}
        <div
          className="relative order-1 overflow-hidden rounded-3xl border border-temple-gold/30 shadow-[0_18px_50px_rgba(87,42,4,0.18)] lg:order-2 lg:col-span-2"
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH || ""}/parchment.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#f3e6c8]/40" />
          <div className="relative flex h-full flex-col items-center justify-center px-6 py-12 text-center sm:px-10">
            <span className="text-2xl text-[#8a5a1c]">&#x0950;</span>
            {/* Panchanga Phala Sloka — replaced per the client's 07-08 image
                (Jyotisha Shastra verse + its English meaning). */}
            <div className="mt-3 space-y-1.5 font-heading text-lg leading-9 text-[#3a2208] sm:text-xl">
              <p>तिथेश्च श्रीकरं प्रोक्तम्</p>
              <p>वारात् आयुष्य वर्धनम्</p>
              <p>नक्षत्रात् हरते पापम्</p>
              <p>योगात् रोग निवारणम्</p>
              <p>करणात् कार्य सिद्धिस्यातः</p>
              <p>पञ्चाङ्ग फलम् उत्तमम्</p>
            </div>
            <p className="mt-4 font-accent text-[11px] font-bold uppercase tracking-[0.28em] text-[#8a5a1c]">
              Panchanga Phala Sloka &middot; Jyotisha Shastra
            </p>
            <p className="mt-3 max-w-md font-accent text-sm italic leading-relaxed text-[#5a3a14]">
              Know the Sinodic Days for prosperity, Weekdays for longevity,
              Asterism for cleansing the sins, Luminal union to treat diseases
              and Active Day for Success. Knowing these five phases of time
              result in goodness.
            </p>
          </div>
        </div>

        {/* Right box (outside the main box) — Understanding Timings */}
        <div className="order-3 rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-premium">
          <h2 className="font-heading text-lg font-bold text-temple-maroon">
            Understanding Timings
          </h2>
          <div className="mt-3 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
              <p>
                <strong>Rahu Kalam:</strong> Inauspicious period ruled by Rahu.
                Avoid starting new activities.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-full bg-orange-500 flex-shrink-0" />
              <p>
                <strong>Yama Gandam:</strong> Inauspicious period associated with
                Yama. Avoid important decisions.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-full bg-yellow-600 flex-shrink-0" />
              <p>
                <strong>Gulika Kalam:</strong> Another inauspicious interval best
                reserved for routine tasks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location picker */}
      <div className="mt-6 rounded-2xl border border-temple-gold/25 bg-temple-cream/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-temple-maroon">
            <MapPin className="h-5 w-5 text-temple-gold" />
            <span className="font-semibold">
              Showing Panchangam for <span className="underline">{location.label}</span>
            </span>
          </div>
          <button
            onClick={async () => {
              setDetectingLoc(true);
              setGeoMsg("");
              const found = await detectCurrentLocation();
              setDetectingLoc(false);
              if (!found) {
                setGeoMsg("Couldn't detect your location — keeping your current selection.");
              }
            }}
            disabled={detectingLoc}
            className="inline-flex items-center gap-2 rounded-lg bg-temple-maroon px-3 py-1.5 text-xs font-semibold text-white hover:bg-temple-maroon/90 disabled:opacity-60"
          >
            <Navigation className="h-3.5 w-3.5" />
            {detectingLoc ? "Detecting\u2026" : "Use current location"}
          </button>
        </div>
        {geoMsg && (
          <p role="status" className="mt-2 text-xs text-amber-700">{geoMsg}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_LOCATIONS.map((preset) => {
            const active = preset.label === location.label;
            return (
              <button
                key={preset.label}
                onClick={() => setLocation(preset)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-temple-red text-white"
                    : "bg-white text-temple-maroon hover:bg-temple-gold/10 border border-temple-gold/30"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Timings are shown in your selected location&apos;s timezone.
        </p>
      </div>

      <div className="mt-8" aria-busy={loading && !hasError}>
        {loading && !hasError && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 text-sm text-gray-600"
          >
            Calculating live Panchangam for {location.label}...
          </p>
        )}
        {hasError ? (
          <div className="rounded-2xl border border-temple-red/30 bg-[#FDF1EE] p-6 text-center">
            <p className="font-semibold text-temple-maroon">
              Unable to load panchangam — try a different location or refresh
            </p>
          </div>
        ) : (
          <PanchangamWidget panchangam={computed} />
        )}
      </div>
    </div>
  );
}
