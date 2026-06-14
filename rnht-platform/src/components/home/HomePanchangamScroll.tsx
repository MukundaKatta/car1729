"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  Download,
  Moon,
  Sun,
} from "lucide-react";
import {
  computePanchangam,
  createPanchangamLoadingState,
  type ComputedPanchangam,
} from "@/lib/panchangam";
import { usePanchangamStore } from "@/store/panchangam";

function formatHeaderDate(date: string, timeZone: string) {
  const value = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(value);
}

function getDisplayDateParts(date: string, timeZone: string) {
  const value = new Date(`${date}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  }).format(value);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone,
  }).format(value);
  const day = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    timeZone,
  }).format(value);
  const year = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone,
  }).format(value);

  return { weekday, month, day, year };
}

export function HomePanchangamScroll() {
  const location = usePanchangamStore((s) => s.location);
  const [p, setP] = useState<ComputedPanchangam>(() =>
    createPanchangamLoadingState(location)
  );
  const [hasError, setHasError] = useState(false);
  const calendarYear = new Date().getFullYear();
  // Absolute URL so the PDF also works inside the native apps, where the
  // 12 MB file is stripped from the bundled assets (build-mobile.sh) and
  // opens via the in-app browser instead.
  const calendarPdfHref = `https://rnht-platform.web.app/downloads/${calendarYear}-rnht.pdf`;
  const calendarPreviewHref = `/downloads/preview/${calendarYear}-rnht-preview.jpg`;
  const formattedDate = formatHeaderDate(p.date, location.timeZone);
  const dateParts = getDisplayDateParts(p.date, location.timeZone);

  // Panchangam defaults to the temple's location (Austin). We intentionally do
  // NOT auto-request geolocation on the home page — prompting for location on
  // first visit without user intent is poor UX (and needs a usage description
  // on iOS). Users can set their location from the Panchangam page.

  useEffect(() => {
    let cancelled = false;

    async function loadPanchangam() {
      setHasError(false);
      setP(createPanchangamLoadingState(location));

      try {
        const data = await computePanchangam(location);
        if (!cancelled) {
          setP(data);
        }
      } catch (error) {
        console.error("Failed to load live Panchangam", error);
        if (!cancelled) {
          setP(createPanchangamLoadingState(location));
          setHasError(true);
        }
      }
    }

    loadPanchangam();

    return () => {
      cancelled = true;
    };
  }, [location]);

  const sacredTimings = [
    {
      label: "Rahu Kalam",
      value: `${p.rahu_kalam.start} - ${p.rahu_kalam.end}`,
      tone: "warn" as const,
    },
    {
      label: "Yamaganda",
      value: `${p.yama_gandam.start} - ${p.yama_gandam.end}`,
      tone: "warn" as const,
    },
    {
      label: "Gulika Kalam",
      value: `${p.gulika_kalam.start} - ${p.gulika_kalam.end}`,
      tone: "warn" as const,
    },
    {
      label: "Amrut Kalam",
      value: `${p.muhurtham.start} - ${p.muhurtham.end}`,
      tone: "good" as const,
    },
  ];

  const lunarDetails = [
    { label: "Tithi", value: `${p.tithi.paksha} ${p.tithi.name}` },
    { label: "Nakshatra", value: p.nakshatra.name },
    { label: "Yoga", value: p.yoga.name },
    { label: "Karana", value: p.karana.name },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div className="gold-particles" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-accent text-sm font-semibold uppercase tracking-[0.2em] text-temple-gold">
            Daily Guidance
          </p>
          <h2 className="mt-2 section-heading">Today&rsquo;s Panchangam</h2>
          <div className="ornament-divider">
            <span>&#x2733;</span>
          </div>
          <p className="mx-auto max-w-xl font-accent text-base text-gray-600 sm:text-lg">
            Vedic almanac for {p.location} on {formattedDate}
          </p>
        </div>

        {hasError && (
          <div
            role="alert"
            className="mx-auto mt-6 max-w-xl rounded-xl border border-temple-red/30 bg-[#FDF1EE] px-4 py-3 text-center text-sm font-semibold text-temple-maroon"
          >
            Unable to load panchangam — try a different location or refresh
          </div>
        )}

        <div className="mt-10 grid items-start gap-6 sm:mt-12 lg:grid-cols-3">
          <Link
            href="/panchangam"
            aria-label="Open full Panchangam page"
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-temple-gold/40 p-5 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-temple-gold/60 hover:shadow-premium-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-gold sm:p-7 lg:col-span-2"
            style={{
              // Client request (#2, final): the red mandala lives ONLY inside
              // this panchangam card — the section around it stays light.
              backgroundColor: "#7d0f18",
              backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH || ""}/red-mandala-bg.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-temple-gold to-temple-gold-dark p-[3px] shadow-gold-glow">
                  <div className="rounded-[14px] bg-temple-ivory px-4 py-3 text-center">
                    <p className="font-heading text-4xl font-black leading-none text-temple-maroon sm:text-5xl">
                      {dateParts.day}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-temple-gold-light">
                    {dateParts.weekday}
                  </p>
                  <p className="font-heading text-xl font-bold leading-tight text-white sm:text-2xl">
                    {dateParts.month} {dateParts.year}
                  </p>
                  <p className="mt-1 text-xs text-gray-200">
                    {p.masa} Masa &middot; {p.samvatsara} Samvatsara
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-temple-gold/40 bg-[#FFF8E7]/95 px-4 py-3 sm:max-w-[18rem]">
                {p.festival ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-temple-saffron">
                      Festival &middot; Vrata
                    </p>
                    <p className="mt-1 font-heading text-base font-bold leading-snug text-temple-maroon sm:text-lg">
                      {p.festival.name}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-temple-saffron">
                      Today&rsquo;s Tithi
                    </p>
                    <p className="mt-1 font-heading text-base font-bold leading-snug text-temple-maroon sm:text-lg">
                      {p.tithi.paksha} {p.tithi.name}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-6 rounded-xl border border-temple-gold/20 bg-white/90 px-4 py-3 sm:gap-12">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-temple-saffron" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Sunrise
                  </p>
                  <p className="font-heading text-sm font-bold text-temple-maroon sm:text-base">
                    {p.sunrise}
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-temple-gold/25" />
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-temple-maroon" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Sunset
                  </p>
                  <p className="font-heading text-sm font-bold text-temple-maroon sm:text-base">
                    {p.sunset}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-temple-gold-light" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-temple-gold-light">
                  Sacred Timings
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {sacredTimings.map((t) => (
                  <div
                    key={t.label}
                    className={`rounded-xl border px-3 py-2.5 ${
                      t.tone === "good"
                        ? "border-emerald-200/80 bg-emerald-50/95"
                        : "border-temple-red/20 bg-[#FDF1EE]/95"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {t.label}
                    </p>
                    <p className="mt-1 font-heading text-sm font-bold text-temple-maroon">
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-temple-gold/20 bg-white/90 px-3 py-3 sm:grid-cols-4 sm:gap-4 sm:px-4">
              {lunarDetails.map((d) => (
                <div key={d.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {d.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-temple-maroon">
                    {d.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-200">Based on {p.location}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-temple-gold-light transition-colors group-hover:text-white">
                View Full Panchangam
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          <a
            href={calendarPdfHref}
            download
            aria-label={`Download ${calendarYear} RNHT calendar PDF`}
            className="group relative flex flex-col rounded-3xl border border-temple-gold/30 bg-gradient-to-br from-temple-maroon to-temple-maroon-deep p-5 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-temple-gold/50 hover:shadow-premium-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-gold sm:p-6"
          >
            <div className="flex items-start justify-between">
              <CalendarIcon className="h-7 w-7 text-temple-gold" />
              <span className="rounded-full border border-temple-gold/40 bg-white/5 px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.18em] text-temple-gold-light">
                PDF
              </span>
            </div>
            <p className="mt-5 font-accent text-xs font-semibold uppercase tracking-[0.22em] text-temple-gold">
              Temple Calendar
            </p>
            <h3 className="mt-2 font-heading text-2xl font-bold text-white">
              {calendarYear} RNHT Calendar
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Full year of festival dates, observances, and temple milestones.
            </p>

            <div className="relative mt-5 overflow-hidden rounded-xl border border-temple-gold/20 bg-temple-maroon-deep/60">
              <Image
                src={calendarPreviewHref}
                alt={`${calendarYear} RNHT Calendar preview`}
                width={1600}
                height={1200}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>

            <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-temple-gold px-4 py-2.5 text-sm font-bold text-temple-maroon-deep transition-colors group-hover:bg-temple-gold-light">
              <Download className="h-4 w-4" />
              Download Calendar
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
