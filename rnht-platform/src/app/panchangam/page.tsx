"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { getLivePanchangam } from "@/app/actions/panchangam";
import { PanchangamWidget } from "@/components/panchangam/PanchangamWidget";
import {
  createPanchangamLoadingState,
  type ComputedPanchangam,
} from "@/lib/panchangam";
import { usePanchangamStore, PRESET_LOCATIONS } from "@/store/panchangam";

export default function PanchangamPage() {
  const location = usePanchangamStore((s) => s.location);
  const setLocation = usePanchangamStore((s) => s.setLocation);
  const detectCurrentLocation = usePanchangamStore((s) => s.detectCurrentLocation);
  const [computed, setComputed] = useState<ComputedPanchangam>(() =>
    createPanchangamLoadingState(location)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionKey = "rnht-panchangam-location-requested";
    if (window.sessionStorage.getItem(sessionKey)) return;

    window.sessionStorage.setItem(sessionKey, "1");
    void detectCurrentLocation();
  }, [detectCurrentLocation]);

  useEffect(() => {
    let cancelled = false;

    async function loadPanchangam() {
      setLoading(true);
      setComputed(createPanchangamLoadingState(location));

      try {
        const data = await getLivePanchangam(location);
        if (!cancelled) {
          setComputed(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load live Panchangam", error);
        if (!cancelled) {
          setComputed(createPanchangamLoadingState(location));
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
            onClick={() => detectCurrentLocation()}
            className="inline-flex items-center gap-2 rounded-lg bg-temple-maroon px-3 py-1.5 text-xs font-semibold text-white hover:bg-temple-maroon/90"
          >
            <Navigation className="h-3.5 w-3.5" />
            Use current location
          </button>
        </div>
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
        <p className="mt-3 text-xs text-gray-500">
          Timings are shown in your selected location&apos;s timezone.
        </p>
      </div>

      <div className="mt-8">
        {loading && (
          <p className="mb-4 text-sm text-gray-500">
            Calculating live Panchangam for {location.label}...
          </p>
        )}
        <PanchangamWidget panchangam={computed} />
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[1.75rem] border border-temple-gold/20 bg-gradient-to-br from-[#fff9eb] to-[#fff4d6] shadow-[0_18px_50px_rgba(87,42,4,0.08)]">
          <div className="border-b border-temple-gold/15 bg-temple-gold/10 px-6 py-4">
            <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-temple-gold-dark">
              Panchangam Vivarana
            </p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-temple-maroon">
              పంచాంగ వివరణ
            </h3>
          </div>
          <div className="px-6 py-6">
            <p className="text-lg leading-9 text-gray-800">
              పంచాంగము అనగా 5 అంగములు (అవయములు) కలిగినది. కాలమునకు 5
              అవయములు కలవు. తిథి, వారము, నక్షత్రము, యోగము, కరణము ఈ 5
              అవయములు కాలము యొక్క ఫలమును వెల్లడించును. కార్యమును
              సాధింపదలచిన వారు ఈ విషయములను తెలుసికొనవలయును.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-temple-gold/20 bg-gradient-to-br from-[#fff8ef] via-white to-[#fff3de] shadow-[0_18px_50px_rgba(87,42,4,0.08)]">
          <div className="border-b border-temple-gold/15 bg-temple-maroon/5 px-6 py-4">
            <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-temple-gold-dark">
              Traditional Slokam
            </p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-temple-maroon">
              పంచాంగ శ్లోకం
            </h3>
          </div>
          <div className="space-y-5 px-6 py-6 text-gray-800">
            <div className="rounded-2xl bg-temple-maroon/[0.03] px-5 py-5">
              <p className="text-lg leading-9">
                తిథి వారంచ నక్షత్రం యోగః కరణ మేవచ ।
              </p>
              <p className="text-lg leading-9">
                పంచాంగమితి విఖ్యాతం లోకయాం కర్మసాధకః ॥
              </p>
            </div>

            <div className="rounded-2xl border border-temple-gold/15 bg-white/80 px-5 py-5">
              <p className="text-lg leading-9">
                తిథేశ్చ శ్రియమాప్నోతి వారాదాయుష్యవర్ధనం ।
              </p>
              <p className="text-lg leading-9">
                నక్షత్రాద్ధరతే పాపం యోగాద్రోగ నివారణం ॥
              </p>
              <p className="mt-3 text-lg leading-9">
                కరణాత్కార్య సిద్ధిశ్చ పంచాంగ ఫలముత్తమం ।
              </p>
              <p className="text-lg leading-9">
                కాలవిత్ కర్మణాం శ్రేష్ఠం లభేత్ శుభం ॥
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-heading text-lg font-bold text-gray-900">
            What is Panchangam?
          </h3>
          <p className="mt-3 text-sm text-gray-600">
            Panchangam (Panchanga) is a Hindu calendar and almanac that tracks
            five key attributes of each day: <strong>Tithi</strong> (lunar day),{" "}
            <strong>Vaara</strong> (weekday), <strong>Nakshatra</strong> (lunar
            mansion), <strong>Yoga</strong> (luni-solar day), and{" "}
            <strong>Karana</strong> (half of Tithi). It is essential for
            determining auspicious times for rituals, ceremonies, and
            important activities.
          </p>
        </div>
        <div className="card p-6">
          <h3 className="font-heading text-lg font-bold text-gray-900">
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
                <strong>Yama Gandam:</strong> Inauspicious period associated
                with Yama. Avoid important decisions.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-3 w-3 rounded-full bg-yellow-600 flex-shrink-0" />
              <p>
                <strong>Gulika Kalam:</strong> Another inauspicious interval
                best reserved for routine tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
