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
        const data = await computePanchangam(location);
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

      {/* Panchangam Shloka — antique manuscript layout: Meaning | Slok | Timing */}
      <section
        className="relative mt-8 overflow-hidden rounded-3xl border border-temple-gold/30 shadow-[0_18px_50px_rgba(87,42,4,0.18)]"
        style={{
          backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH || ""}/parchment.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#f3e6c8]/55" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-3 lg:gap-8">
          {/* Left — English meaning */}
          <div className="order-2 rounded-2xl bg-[#f7eeda]/85 p-5 ring-1 ring-[#9c7b3f]/30 lg:order-1">
            <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-[#8a5a1c]">
              Meaning
            </p>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[#4a3214]">
              <p>
                Tithi, V&#x101;ra (weekday), Nakshatra, Yoga and Karana &mdash;
                these five together are renowned as the{" "}
                <strong>Panch&#x101;nga</strong>, by which all auspicious works
                are accomplished.
              </p>
              <p>
                From the Tithi one gains prosperity; from the V&#x101;ra, long
                life; from the Nakshatra, removal of sins; from the Yoga,
                freedom from disease; and from the Karana, success in one&rsquo;s
                endeavours.
              </p>
              <p>
                Thus the Panch&#x101;nga yields the highest fruit &mdash; one who
                knows the right time attains the best of all actions and obtains
                blessedness.
              </p>
            </div>
          </div>

          {/* Center — Sanskrit shloka */}
          <div className="order-1 flex flex-col items-center justify-center text-center lg:order-2">
            <span className="text-2xl text-[#8a5a1c]">&#x0950;</span>
            <div className="mt-3 space-y-2 font-heading text-base leading-9 text-[#3a2208] sm:text-lg">
              <p>तिथिर्वारं च नक्षत्रं योगः करणमेव च ।</p>
              <p>पञ्चाङ्गमिति विख्यातं लोकयां कर्मसाधकः ॥</p>
              <p>तिथेश्च श्रियमाप्नोति वारादायुर्वर्धनम् ।</p>
              <p>नक्षत्राद्धरते पापं योगाद्रोगनिवारणम् ॥</p>
              <p>करणात्कार्यसिद्धिश्च पञ्चाङ्गफलमुत्तमम् ।</p>
              <p>कालवित् कर्मणां श्रेष्ठं लभेत् शुभम् ॥</p>
            </div>
          </div>

          {/* Right — live Panchangam timings */}
          <div className="order-3 rounded-2xl bg-[#f7eeda]/85 p-5 ring-1 ring-[#9c7b3f]/30">
            <p className="font-accent text-xs font-semibold uppercase tracking-[0.28em] text-[#8a5a1c]">
              Timing
            </p>
            <dl className="mt-3 space-y-2.5 text-sm text-[#4a3214]">
              {[
                {
                  label: "Sunrise / Sunset",
                  value: `${computed.sunrise} / ${computed.sunset}`,
                },
                {
                  label: "Tithi",
                  value: `${computed.tithi.paksha} ${computed.tithi.name}`,
                },
                { label: "Nakshatra", value: computed.nakshatra.name },
                {
                  label: "Rahu Kalam",
                  value: `${computed.rahu_kalam.start} - ${computed.rahu_kalam.end}`,
                },
                {
                  label: "Amrut Kalam",
                  value: `${computed.muhurtham.start} - ${computed.muhurtham.end}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 border-b border-[#9c7b3f]/20 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="font-semibold text-[#8a5a1c]">{row.label}</dt>
                  <dd className="text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

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

      <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-temple-gold/20 bg-gradient-to-br from-[#fff9eb] to-[#fff4d6] shadow-[0_18px_50px_rgba(87,42,4,0.08)]">
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
