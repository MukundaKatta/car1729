"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  })
    .format(value)
    .toUpperCase();
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
  const detectCurrentLocation = usePanchangamStore((s) => s.detectCurrentLocation);
  const [p, setP] = useState<ComputedPanchangam>(() =>
    createPanchangamLoadingState(location)
  );
  const calendarPdfHref = "/downloads/2026-rnht.pdf";
  const calendarPreviewHref = "/downloads/preview/2026-rnht.pdf.png";
  const sharedCardHeight = "h-[38rem] sm:h-[42rem] xl:h-[46rem]";
  const formattedDate = formatHeaderDate(p.date, location.timeZone);
  const dateParts = getDisplayDateParts(p.date, location.timeZone);

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
        }
      }
    }

    loadPanchangam();

    return () => {
      cancelled = true;
    };
  }, [location]);

  return (
    <section className="relative overflow-hidden bg-[#06203A] py-20">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at center, rgba(21,114,182,0.28) 0%, rgba(6,32,58,0.92) 52%, rgba(2,11,23,1) 100%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(71,177,255,0.18) 0%, rgba(71,177,255,0.06) 42%, transparent 68%)",
          boxShadow: "0 0 140px rgba(47,150,255,0.18)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[31rem] w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/20 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, transparent 0 56%, rgba(64,164,255,0.22) 56.5%, transparent 57%), radial-gradient(circle at center, transparent 0 72%, rgba(64,164,255,0.18) 72.5%, transparent 73%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-accent text-xs font-semibold uppercase tracking-[0.32em] text-[#d5b15f]">
            Daily Guidance
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Panchangam
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200/85 sm:text-base">
            Daily tithi, nakshatra, yoga, karana, and sacred timings presented
            in an ornate scroll inspired by traditional almanac art.
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-8 xl:grid-cols-2">
          <div className="relative mx-auto flex h-full w-full max-w-[32rem]">
            <Link
              href="/panchangam"
              className="group relative block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c56e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#06203A]"
              aria-label="Open Panchangam page"
            >
              <div className={`relative ${sharedCardHeight}`}>
                <div className="pointer-events-none absolute inset-x-[6%] top-[4.8rem] bottom-[4.2rem] rounded-[2rem] bg-black/30 blur-2xl" />

                <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-1 sm:px-2">
                  {[-1, 1].map((side) => (
                    <div
                      key={side}
                      className="relative h-12 w-12 rounded-full sm:h-14 sm:w-14"
                      style={{
                        background:
                          "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                        boxShadow:
                          "0 10px 20px rgba(0,0,0,0.35), inset 0 2px 5px rgba(255,255,255,0.35)",
                      }}
                    >
                      <div className="absolute inset-[16%] rounded-full border border-[#f8e09d]/70" />
                      <div className="absolute inset-y-[18%] left-[38%] w-[24%] rounded-full bg-white/20 blur-[1px]" />
                      <div
                        className={`absolute top-1/2 h-4 w-7 -translate-y-1/2 sm:h-5 sm:w-9 ${
                          side < 0 ? "left-[75%]" : "right-[75%]"
                        }`}
                        style={{
                          background:
                            "linear-gradient(180deg, #ff6f3a 0%, #d51709 40%, #9e0f08 100%)",
                          borderRadius: side < 0 ? "0 999px 999px 0" : "999px 0 0 999px",
                          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25)",
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div
                  className="relative mx-8 rounded-[999px] border border-[#9b210d] px-10 py-3 text-center sm:mx-10 sm:py-4"
                  style={{
                    background:
                      "linear-gradient(180deg, #ff5d27 0%, #ec230a 28%, #b91408 66%, #8d0f07 100%)",
                    boxShadow:
                      "0 16px 28px rgba(0,0,0,0.34), inset 0 2px 7px rgba(255,255,255,0.16), inset 0 -5px 12px rgba(77,0,0,0.38)",
                  }}
                >
                  <div className="absolute inset-x-4 top-1/2 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <div className="absolute left-5 top-[4.3rem] z-10 hidden sm:block">
                  <div className="flex flex-col items-center">
                    <div
                      className="h-8 w-8 rotate-45 rounded-[0.35rem]"
                      style={{
                        background:
                          "linear-gradient(135deg, #ffe39b 0%, #cc8f11 45%, #7d5007 100%)",
                        boxShadow: "0 8px 14px rgba(0,0,0,0.28)",
                      }}
                    />
                    <div className="h-12 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                        boxShadow:
                          "0 10px 18px rgba(0,0,0,0.32), inset 0 2px 5px rgba(255,255,255,0.3)",
                      }}
                    />
                    <div className="h-16 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                    <div
                      className="h-24 w-8 rounded-b-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #ff8d48 0%, #ef4612 26%, #b40f09 78%, #880706 100%)",
                        clipPath:
                          "polygon(30% 0%, 70% 0%, 100% 12%, 78% 100%, 22% 100%, 0% 12%)",
                        boxShadow: "0 14px 20px rgba(0,0,0,0.26)",
                      }}
                    />
                  </div>
                </div>

                <div className="absolute right-5 top-[4.3rem] z-10 hidden sm:block">
                  <div className="flex flex-col items-center">
                    <div
                      className="h-8 w-8 rotate-45 rounded-[0.35rem]"
                      style={{
                        background:
                          "linear-gradient(135deg, #ffe39b 0%, #cc8f11 45%, #7d5007 100%)",
                        boxShadow: "0 8px 14px rgba(0,0,0,0.28)",
                      }}
                    />
                    <div className="h-12 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                    <div
                      className="h-10 w-10 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                        boxShadow:
                          "0 10px 18px rgba(0,0,0,0.32), inset 0 2px 5px rgba(255,255,255,0.3)",
                      }}
                    />
                    <div className="h-16 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                    <div
                      className="h-24 w-8 rounded-b-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #ff8d48 0%, #ef4612 26%, #b40f09 78%, #880706 100%)",
                        clipPath:
                          "polygon(30% 0%, 70% 0%, 100% 12%, 78% 100%, 22% 100%, 0% 12%)",
                        boxShadow: "0 14px 20px rgba(0,0,0,0.26)",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="relative flex h-[calc(100%-3.5rem)] flex-col overflow-hidden rounded-[2.15rem] border-x-[10px] border-[#d98f11] px-5 pb-7 pt-9 sm:border-x-[14px] sm:px-8 sm:pb-9 sm:pt-10"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,62,25,0.98) 0%, rgba(218,21,9,0.99) 16%, rgba(154,10,8,0.99) 58%, rgba(92,5,8,0.99) 100%)",
                    boxShadow:
                      "0 28px 56px rgba(0,0,0,0.36), inset 0 3px 10px rgba(255,255,255,0.12), inset 0 -16px 22px rgba(72,0,0,0.25)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.11]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.16) 0, transparent 22%), radial-gradient(circle at 80% 28%, rgba(255,255,255,0.08) 0, transparent 18%), linear-gradient(0deg, transparent 0 87%, rgba(255,255,255,0.05) 87% 100%), linear-gradient(90deg, transparent 0 87%, rgba(255,255,255,0.04) 87% 100%)",
                      backgroundSize: "auto, auto, 58px 58px, 58px 58px",
                    }}
                  />
                  <div className="absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-[#ffd978]/60 to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 h-px bg-gradient-to-r from-transparent via-[#ffd978]/40 to-transparent" />
                  <div className="absolute inset-x-[6%] inset-y-4 rounded-[1.8rem] border border-white/8" />

                  <div className="relative mx-auto flex h-full max-w-[28rem] flex-col text-center text-[#fff6df]">
                    <div className="mx-auto mb-5 flex items-center gap-3 rounded-full border border-[#f0cf80]/25 bg-black/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ffdf96] sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ffd66e]" />
                      Daily Almanac
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ffd66e]" />
                    </div>

                    <div
                      className="mx-auto inline-flex max-w-full items-center gap-3 rounded-[1.1rem] border border-[#b8842b] px-5 py-3 shadow-[0_12px_28px_rgba(45,14,4,0.36)] sm:px-8"
                      style={{
                        background:
                          "linear-gradient(180deg, #fff8e2 0%, #f2deb1 48%, #ddb96f 100%)",
                      }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-[#b32112] shadow-[0_0_10px_rgba(179,33,18,0.45)]" />
                      <span className="font-heading text-lg font-black uppercase tracking-[0.16em] text-[#931c12] sm:text-[1.9rem]">
                        Panchangam
                      </span>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#b32112] shadow-[0_0_10px_rgba(179,33,18,0.45)]" />
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,245,222,0.1),rgba(95,0,0,0.08))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ffe7ae] sm:text-base">
                        {dateParts.weekday}
                      </p>
                      <div className="mt-3 flex items-end justify-center gap-3 text-white">
                        <span className="font-heading text-[3.4rem] font-black leading-none sm:text-[4.4rem]">
                          {dateParts.day}
                        </span>
                        <div className="pb-1 text-left">
                          <p className="font-heading text-2xl font-bold uppercase tracking-[0.12em] sm:text-[2rem]">
                            {dateParts.month}
                          </p>
                          <p className="text-base font-semibold tracking-[0.22em] text-[#ffe1a0] sm:text-lg">
                            {dateParts.year}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-[11px] uppercase tracking-[0.34em] text-[#ffd978] sm:text-xs">
                        {p.masa} Masa • {p.samvatsara}
                      </p>
                    </div>

                    <div className="mt-5 rounded-[1.35rem] border border-[#f1cb71]/18 bg-black/10 px-4 py-3 sm:px-5">
                      {p.festival ? (
                        <>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#ffd978] sm:text-xs">
                            Festival & Vrata
                          </p>
                          <p className="mt-2 text-base font-semibold leading-snug text-[#fff0c8] sm:text-[1.08rem]">
                            {p.festival.name}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#ffd978] sm:text-xs">
                            Sacred Day Flow
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-[#fff0c8]/90 sm:text-base">
                            Tithi, nakshatra, yoga, and key timings for the day.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ffd978]">
                          Lunar Details
                        </p>
                        <div className="mt-3 space-y-2 text-sm leading-snug text-[#fff4d8] sm:text-[0.98rem]">
                          <p>
                            <span className="font-semibold text-[#ffe4a5]">Tithi</span>
                            <br />
                            {p.tithi.name} • {p.tithi.paksha}
                          </p>
                          <p>
                            <span className="font-semibold text-[#ffe4a5]">Nakshatra</span>
                            <br />
                            {p.nakshatra.name}
                          </p>
                          <p className="text-xs text-[#ffe8b7] sm:text-sm">
                            {p.nakshatra.start} - {p.nakshatra.end}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ffd978]">
                          Inner Balance
                        </p>
                        <div className="mt-3 space-y-2 text-sm leading-snug text-[#fff4d8] sm:text-[0.98rem]">
                          <p>
                            <span className="font-semibold text-[#ffe4a5]">Yoga</span>
                            <br />
                            {p.yoga.name}
                          </p>
                          <p>
                            <span className="font-semibold text-[#ffe4a5]">Karana</span>
                            <br />
                            {p.karana.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.45rem] border border-[#f1cb71]/18 bg-[linear-gradient(180deg,rgba(50,0,0,0.12),rgba(255,255,255,0.05))] px-4 py-4 text-left sm:px-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#ffd978] sm:text-xs">
                        Key Timings
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {[
                          ["Rahu Kalam", `${p.rahu_kalam.start} - ${p.rahu_kalam.end}`],
                          ["Gulika Kalam", `${p.gulika_kalam.start} - ${p.gulika_kalam.end}`],
                          ["Yamaganda", `${p.yama_gandam.start} - ${p.yama_gandam.end}`],
                          ["Muhurtham", `${p.muhurtham.start} - ${p.muhurtham.end}`],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffe4a5]">
                              {label}
                            </p>
                            <p className="mt-2 text-sm font-medium text-[#fff4d8] sm:text-[0.98rem]">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      <p className="text-[11px] uppercase tracking-[0.34em] text-[#ffd978] sm:text-xs">
                        Based on {p.location}
                      </p>

                      <div className="mt-5">
                        <span className="inline-flex items-center rounded-full border border-[#ffdb87]/30 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#fff4d8] transition-transform duration-300 group-hover:scale-[1.03]">
                          View Full Panchangam
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-1 sm:px-2">
                  {[-1, 1].map((side) => (
                    <div
                      key={side}
                      className="relative h-12 w-12 rounded-full sm:h-14 sm:w-14"
                      style={{
                        background:
                          "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                        boxShadow:
                          "0 10px 20px rgba(0,0,0,0.35), inset 0 2px 5px rgba(255,255,255,0.35)",
                      }}
                    >
                      <div className="absolute inset-[16%] rounded-full border border-[#f8e09d]/70" />
                      <div className="absolute inset-y-[18%] left-[38%] w-[24%] rounded-full bg-white/20 blur-[1px]" />
                      <div
                        className={`absolute bottom-1/2 h-4 w-7 translate-y-1/2 sm:h-5 sm:w-9 ${
                          side < 0 ? "left-[75%]" : "right-[75%]"
                        }`}
                        style={{
                          background:
                            "linear-gradient(180deg, #ff6f3a 0%, #d51709 40%, #9e0f08 100%)",
                          borderRadius: side < 0 ? "0 999px 999px 0" : "999px 0 0 999px",
                          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </div>

          <a
            href={calendarPdfHref}
            download
            className={`group relative mx-auto flex w-full max-w-[32rem] overflow-hidden rounded-[2.25rem] border border-[#d8ba73]/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(87,111,140,0.2)_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.34)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c56e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#06203A] ${sharedCardHeight}`}
            aria-label="Download 2026 RNHT calendar PDF"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,230,166,0.14),transparent_34%),linear-gradient(180deg,rgba(17,40,70,0.2),rgba(7,19,38,0.48))]" />
            <div className="relative flex h-full w-full flex-col">
              <div className="mb-4 flex items-start justify-between gap-4 px-2 pt-2">
                <div>
                  <p className="font-accent text-xs font-semibold uppercase tracking-[0.3em] text-[#ebca72]">
                    Temple Calendar
                  </p>
                  <h3 className="mt-3 font-heading text-[1.85rem] font-bold leading-tight text-white sm:text-[2.1rem]">
                    2026 RNHT Calendar
                  </h3>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f7e6b4]">
                  PDF
                </span>
              </div>

              <div className="relative overflow-hidden rounded-[1.7rem] border border-[#edd598]/35 bg-[#132846]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#08203f]/65 to-transparent" />
                <Image
                  src={calendarPreviewHref}
                  alt="Preview of the first page of the 2026 RNHT calendar PDF"
                  width={1200}
                  height={1600}
                  className={`w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02] ${sharedCardHeight}`}
                />
                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#08162c] via-[#08162c]/92 to-transparent px-5 pb-5 pt-20">
                  <p className="max-w-sm text-sm leading-7 text-slate-200/92">
                    Download the full calendar with festival dates, observances,
                    and temple milestones for the year.
                  </p>
                  <span className="mt-5 inline-flex items-center rounded-full border border-[#f1d58f]/30 bg-[#f3d27f] px-5 py-2.5 text-xs font-black uppercase tracking-[0.24em] text-[#6d180f] transition-transform duration-300 group-hover:scale-[1.03]">
                    Download Calendar
                  </span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
