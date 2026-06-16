"use client";

import { useEffect, useState } from "react";
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
  // the page falls back to DEFAULT_LOCATION (Georgetown, TX) until the user opts in.

  useEffect(() => {
    let cancelled = false;

    async function loadPanchangam() {
      setLoading(true);
      setHasError(false);
      setComputed(createPanchangamLoadingState(location));

      try {
        const data = await computePanchangam(location);
        if (!cancelled) {
          setComputed(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load live Panchangam", error);
        if (!cancelled) {
          setComputed(createPanchangamLoadingState(location));
          setHasError(true);
          setLoading(false);
        }
      }
    }

    loadPanchangam();

    return () => {
      cancelled = true;
    };
  }, [location]);

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
          <h3 className="font-heading text-lg font-bold text-temple-maroon">
            What is Panchangam?
          </h3>
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
            <div className="mt-3 space-y-2 font-heading text-lg leading-10 text-[#3a2208] sm:text-xl">
              <p>तिथिर्वारं च नक्षत्रं योगः करणमेव च ।</p>
              <p>पञ्चाङ्गमिति विख्यातं लोकयां कर्मसाधकः ॥</p>
              <p>तिथेश्च श्रियमाप्नोति वारादायुर्वर्धनम् ।</p>
              <p>नक्षत्राद्धरते पापं योगाद्रोगनिवारणम् ॥</p>
              <p>करणात्कार्यसिद्धिश्च पञ्चाङ्गफलमुत्तमम् ।</p>
              <p>कालवित् कर्मणां श्रेष्ठं लभेत् शुभम् ॥</p>
            </div>
          </div>
        </div>

        {/* Right box (outside the main box) — Understanding Timings */}
        <div className="order-3 rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-premium">
          <h3 className="font-heading text-lg font-bold text-temple-maroon">
            Understanding Timings
          </h3>
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

      <div className="mt-8">
        {loading && !hasError && (
          <p className="mb-4 text-sm text-gray-600">
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
