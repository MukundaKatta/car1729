"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useSlideshowStore, type Slide } from "@/store/slideshow";
import { samplePanchangam } from "@/lib/sample-data";

/* ─── Golden & White Rhombus Shimmer Lights ─── */
function ShimmeringLights() {
  const [lights, setLights] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number; gold: boolean; glow: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 50 + 48,
      y: Math.random() * 92 + 4,
      size: Math.random() * 10 + 12,
      delay: Math.random() * 10,
      duration: Math.random() * 5 + 2.5,
      gold: Math.random() > 0.4,
      glow: Math.random() * 12 + 6,
    }));
    setLights(generated);
  }, []);

  if (lights.length === 0) return null;

  return (
    <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden" aria-hidden="true">
      {lights.map((l) => (
        <div
          key={l.id}
          className="absolute"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            width: l.size,
            height: l.size,
            animation: `${l.id % 3 === 0 ? "twinkle" : l.id % 3 === 1 ? "twinkleShift" : "driftSparkle"} ${l.duration}s ease-in-out ${l.delay}s infinite`,
            filter: `drop-shadow(0 0 ${l.glow}px ${l.gold ? "rgba(232,195,74,0.8)" : "rgba(255,255,255,0.7)"})`,
          }}
        >
          {/* Rhombus / diamond shape */}
          <svg viewBox="0 0 10 10" className="w-full h-full">
            <polygon
              points="5,0 10,5 5,10 0,5"
              fill={l.gold ? "#F0D060" : "#FFFFFF"}
              opacity={l.gold ? "0.85" : "0.9"}
            />
            {/* Inner bright core */}
            <polygon
              points="5,2 8,5 5,8 2,5"
              fill={l.gold ? "#FFF8DC" : "#FFFFFF"}
              opacity="0.6"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ─── Hanging Panchangam Scroll (Premium Animated) ─── */
function HangingPanchangamScroll() {
  const p = samplePanchangam;
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayName = dayNames[today.getDay()];
  const dateStr = `${dayName} - ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <Link
      href="/panchangam"
      className="absolute right-1 sm:right-4 lg:right-6 top-2 sm:top-12 z-[18] group no-underline scale-[0.55] origin-top-right sm:scale-75 md:scale-90 lg:scale-100"
      style={{ filter: "drop-shadow(0 12px 48px rgba(0,0,0,0.7))" }}
    >
      {/* ══════ GRAND CURTAIN ROD — ornate brass with decorative finials ══════ */}
      <div className="relative flex items-center justify-center" style={{
        animation: "scrollRodAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}>
        {/* Rod body — radiant golden bar with animated shimmer */}
        <div className="w-[280px] sm:w-[420px] md:w-[560px] lg:w-[720px] h-[18px] lg:h-[20px] rounded-full relative overflow-hidden" style={{
          background: "linear-gradient(180deg, #FFFDE7 0%, #F5E17D 10%, #E8C34A 22%, #D4A843 35%, #C5973E 50%, #D4A843 65%, #E8C34A 78%, #F5E17D 90%, #FFFDE7 100%)",
          boxShadow: "0 0 24px rgba(245,225,125,0.4), 0 4px 16px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(139,105,20,0.3)",
        }}>
          {/* Animated golden shimmer sweep */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg, transparent 0%, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,253,231,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 70%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s ease-in-out infinite",
          }} />
          {/* Subtle notch lines for realism */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "repeating-linear-gradient(90deg, transparent 0px, transparent 12px, rgba(139,105,20,0.5) 12px, rgba(139,105,20,0.5) 13px)",
          }} />
        </div>

        {/* Decorative bracket rings on rod */}
        {[-1, 1].map((side) => (
          <div key={side} className="absolute top-1/2 -translate-y-1/2" style={{ [side < 0 ? "left" : "right"]: "18%" }}>
            <div className="w-[7px] h-[24px] lg:h-[26px] rounded-full" style={{
              background: "linear-gradient(180deg, #FFFDE7 0%, #F5E17D 20%, #D4A843 50%, #F5E17D 80%, #FFFDE7 100%)",
              boxShadow: "0 0 6px rgba(245,225,125,0.3), 0 1px 3px rgba(0,0,0,0.3)",
            }} />
          </div>
        ))}

        {/* Left finial — grand ornate sphere with outer ring + glow */}
        <div className="absolute -left-3 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute rounded-full" style={{
            width: 44, height: 44,
            background: "radial-gradient(circle, rgba(245,225,125,0.25) 0%, rgba(212,168,67,0.08) 50%, transparent 70%)",
          }} />
          {/* Outer decorative ring */}
          <div className="absolute w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] rounded-full" style={{
            border: "2px solid rgba(197,151,62,0.5)",
            boxShadow: "inset 0 0 6px rgba(245,225,125,0.15)",
          }} />
          {/* Main sphere */}
          <div className="w-[30px] h-[30px] lg:w-[34px] lg:h-[34px] rounded-full relative" style={{
            background: "radial-gradient(circle at 32% 26%, #FFFDE7 0%, #F5E17D 15%, #E8C34A 30%, #D4A843 45%, #C5973E 60%, #8B6914 80%, #6B4E1A 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 3px 8px rgba(255,255,255,0.35), 0 0 20px rgba(245,225,125,0.2)",
          }}>
            {/* Inner highlight */}
            <div className="absolute top-[20%] left-[22%] w-[35%] h-[25%] rounded-full bg-white/20 blur-[1px]" />
          </div>
        </div>

        {/* Right finial */}
        <div className="absolute -right-3 flex items-center justify-center">
          <div className="absolute rounded-full" style={{
            width: 44, height: 44,
            background: "radial-gradient(circle, rgba(245,225,125,0.25) 0%, rgba(212,168,67,0.08) 50%, transparent 70%)",
          }} />
          <div className="absolute w-[36px] h-[36px] lg:w-[40px] lg:h-[40px] rounded-full" style={{
            border: "2px solid rgba(197,151,62,0.5)",
            boxShadow: "inset 0 0 6px rgba(245,225,125,0.15)",
          }} />
          <div className="w-[30px] h-[30px] lg:w-[34px] lg:h-[34px] rounded-full relative" style={{
            background: "radial-gradient(circle at 32% 26%, #FFFDE7 0%, #F5E17D 15%, #E8C34A 30%, #D4A843 45%, #C5973E 60%, #8B6914 80%, #6B4E1A 100%)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 3px 8px rgba(255,255,255,0.35), 0 0 20px rgba(245,225,125,0.2)",
          }}>
            <div className="absolute top-[20%] left-[22%] w-[35%] h-[25%] rounded-full bg-white/20 blur-[1px]" />
          </div>
        </div>
      </div>

      {/* ══════ SCROLL BODY — rolls down / up in a loop ══════ */}
      <div className="relative w-[280px] sm:w-[420px] md:w-[560px] lg:w-[720px] overflow-hidden" style={{
        animation: "scrollUnrollLoop 16s cubic-bezier(0.4, 0, 0.2, 1) 0.5s infinite",
        transformOrigin: "top center",
      }}>

        {/* Main scroll fabric with grand golden side borders */}
        <div className="relative overflow-hidden" style={{
          background: "linear-gradient(178deg, #E83010 0%, #D92C08 4%, #CC2406 12%, #C01F05 22%, #B31A04 35%, #A81603 50%, #9D1303 65%, #921103 80%, #8B1003 100%)",
        }}>
          {/* ── GOLDEN SIDE BORDERS — thick ornate gold trim ── */}
          <div className="absolute top-0 bottom-0 left-0 w-[8px] z-10 pointer-events-none" style={{
            background: "linear-gradient(90deg, #8B6914 0%, #D4A843 25%, #F5E17D 50%, #D4A843 75%, #8B6914 100%)",
            boxShadow: "2px 0 8px rgba(0,0,0,0.3), inset 0 0 3px rgba(255,255,255,0.2)",
          }} />
          <div className="absolute top-0 bottom-0 right-0 w-[8px] z-10 pointer-events-none" style={{
            background: "linear-gradient(90deg, #8B6914 0%, #D4A843 25%, #F5E17D 50%, #D4A843 75%, #8B6914 100%)",
            boxShadow: "-2px 0 8px rgba(0,0,0,0.3), inset 0 0 3px rgba(255,255,255,0.2)",
          }} />
          {/* Inner gold pinstripe accents */}
          <div className="absolute top-0 bottom-0 left-[10px] w-[1.5px] z-10 pointer-events-none" style={{
            background: "linear-gradient(180deg, rgba(245,225,125,0.5) 0%, rgba(245,225,125,0.2) 50%, rgba(245,225,125,0.4) 100%)",
          }} />
          <div className="absolute top-0 bottom-0 right-[10px] w-[1.5px] z-10 pointer-events-none" style={{
            background: "linear-gradient(180deg, rgba(245,225,125,0.5) 0%, rgba(245,225,125,0.2) 50%, rgba(245,225,125,0.4) 100%)",
          }} />
          {/* Top shadow — curtain emerging from behind the rod */}
          <div className="absolute top-0 left-0 right-0 h-[16px] z-10 pointer-events-none" style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 40%, transparent 100%)",
          }} />
          {/* Side fabric fold shadows for depth */}
          <div className="absolute top-0 bottom-0 left-[8px] w-[20px] z-[9] pointer-events-none" style={{
            background: "linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 100%)",
          }} />
          <div className="absolute top-0 bottom-0 right-[8px] w-[20px] z-[9] pointer-events-none" style={{
            background: "linear-gradient(270deg, rgba(0,0,0,0.15) 0%, transparent 100%)",
          }} />
          {/* Fabric weave texture */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.12) 1px, rgba(255,255,255,0.12) 2px), repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.06) 1px, rgba(255,255,255,0.06) 2px)",
          }} />

          {/* Elegant inner border — golden frame inset from gold side borders */}
          <div className="absolute top-[14px] bottom-[8px] left-[16px] right-[16px] border-[2px] border-[#F5E17D]/25 rounded pointer-events-none" style={{
            boxShadow: "0 0 12px rgba(255,215,0,0.08), inset 0 0 12px rgba(255,215,0,0.05)",
          }} />

          {/* Corner ornaments — gold diamonds */}
          {[
            { t: "10px", l: "12px" },
            { t: "10px", r: "12px" },
          ].map((pos, i) => (
            <div key={i} className="absolute w-4 h-4 pointer-events-none z-10" style={{ top: pos.t, left: pos.l, right: pos.r }}>
              <div className="w-full h-full rotate-45" style={{
                background: "linear-gradient(135deg, #FFD700, #D4A843)",
                boxShadow: "0 0 8px rgba(255,215,0,0.3)",
                opacity: 0.4,
              }} />
            </div>
          ))}

          {/* Scroll content — fades in/out with the loop */}
          <div className="relative px-5 pt-4 pb-5 lg:px-7 lg:pt-5 lg:pb-7" style={{
            animation: "scrollContentLoop 16s ease 0.5s infinite",
          }}>

            {/* OM symbol — radiant shimmer gold */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full" style={{
                    background: "radial-gradient(circle, rgba(255,215,0,0.25) 0%, rgba(255,215,0,0.08) 50%, transparent 70%)",
                  }} />
                </div>
                <span className="relative text-3xl lg:text-[40px] font-heading" style={{
                  background: "linear-gradient(180deg, #FFFDE7 0%, #FFD700 40%, #E8A020 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                }}>&#x0950;</span>
              </div>
            </div>

            {/* PANCHANGAM title with ornate dividers */}
            <div className="flex items-center gap-3 mb-4 lg:mb-5">
              {/* Left ornamental line with diamond */}
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-[1.5px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843)" }} />
                <div className="w-2.5 h-2.5 rotate-45" style={{ background: "linear-gradient(135deg, #FFD700, #C5973E)", boxShadow: "0 0 6px rgba(255,215,0,0.3)" }} />
                <div className="w-4 h-[1.5px]" style={{ background: "#FFD700" }} />
              </div>
              <h3 className="font-heading text-2xl lg:text-3xl font-black tracking-[0.25em] uppercase" style={{
                background: "linear-gradient(90deg, #D4A843 0%, #F5E17D 15%, #FFFDE7 30%, #FFD700 50%, #FFFDE7 70%, #F5E17D 85%, #D4A843 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 5s ease-in-out infinite",
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
              }}>
                Panchangam
              </h3>
              {/* Right ornamental line with diamond */}
              <div className="flex-1 flex items-center gap-1">
                <div className="w-4 h-[1.5px]" style={{ background: "#FFD700" }} />
                <div className="w-2.5 h-2.5 rotate-45" style={{ background: "linear-gradient(135deg, #FFD700, #C5973E)", boxShadow: "0 0 6px rgba(255,215,0,0.3)" }} />
                <div className="flex-1 h-[1.5px]" style={{ background: "linear-gradient(90deg, #D4A843, transparent)" }} />
              </div>
            </div>

            {/* ── Data Table — premium with golden accents ── */}
            <div className="rounded overflow-hidden" style={{
              border: "2px solid rgba(245,225,125,0.35)",
              boxShadow: "inset 0 0 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.15), 0 0 16px rgba(255,215,0,0.06)",
            }}>

              {/* Row 1: Day + Masa */}
              <div className="grid grid-cols-2 divide-x divide-dashed divide-[#F5E17D]/25">
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Day:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] leading-snug font-accent font-semibold">{dateStr}</div>
                </div>
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Masa:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.masa}</div>
                  <div className="text-[#FFF8DC]/40 text-[11px] lg:text-[13px] font-accent italic mt-0.5">{p.samvatsara} Samvatsara</div>
                </div>
              </div>

              <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(245,225,125,0.3) 20%, rgba(255,215,0,0.35) 50%, rgba(245,225,125,0.3) 80%, transparent 95%)" }} />

              {/* Row 2: Tithi + Nakshatra */}
              <div className="grid grid-cols-2 divide-x divide-dashed divide-[#F5E17D]/25">
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Tithi:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.tithi.paksha} {p.tithi.name}</div>
                  <div className="text-[#FFF8DC]/40 text-[11px] lg:text-[13px] font-accent italic mt-0.5">{p.tithi.start} – {p.tithi.end}</div>
                </div>
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nakshatra:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.nakshatra.name}</div>
                  <div className="text-[#FFF8DC]/40 text-[11px] lg:text-[13px] font-accent italic mt-0.5">{p.nakshatra.start} – {p.nakshatra.end}</div>
                </div>
              </div>

              <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(245,225,125,0.3) 20%, rgba(255,215,0,0.35) 50%, rgba(245,225,125,0.3) 80%, transparent 95%)" }} />

              {/* Row 3: Karana + Yoga */}
              <div className="grid grid-cols-2 divide-x divide-dashed divide-[#F5E17D]/25">
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Karana:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.karana.name}</div>
                  <div className="text-[#FFF8DC]/40 text-[11px] lg:text-[13px] font-accent italic mt-0.5">{p.karana.start} – {p.karana.end}</div>
                </div>
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Yoga:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.yoga.name}</div>
                  <div className="text-[#FFF8DC]/40 text-[11px] lg:text-[13px] font-accent italic mt-0.5">{p.yoga.start} – {p.yoga.end}</div>
                </div>
              </div>

              <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(245,225,125,0.3) 20%, rgba(255,215,0,0.35) 50%, rgba(245,225,125,0.3) 80%, transparent 95%)" }} />

              {/* Row 4: Sunrise/Sunset + Rahu Kalam */}
              <div className="grid grid-cols-2 divide-x divide-dashed divide-[#F5E17D]/25">
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FFD700, #F5E17D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sunrise / Sunset:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.sunrise} / {p.sunset}</div>
                </div>
                <div className="p-2.5 lg:p-3">
                  <div className="font-heading text-[15px] lg:text-[17px] tracking-[0.1em] mb-1" style={{ background: "linear-gradient(90deg, #FF8A80, #FFAB91)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Rahu Kalam:</div>
                  <div className="text-[#FFF8DC] text-[15px] lg:text-[17px] font-accent font-semibold">{p.rahu_kalam.start} – {p.rahu_kalam.end}</div>
                </div>
              </div>
            </div>

            {/* Location — ornamental */}
            <div className="mt-4 lg:mt-5 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843)" }} />
                  <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#FFD700" }} />
                  <div className="w-3 h-[1px]" style={{ background: "#FFD700" }} />
                </div>
                <p className="text-xs lg:text-sm font-accent italic tracking-[0.08em]" style={{
                  background: "linear-gradient(90deg, #E8C34A, #FFD700, #E8C34A)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))",
                }}>
                  Based on {p.location}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-[1px]" style={{ background: "#FFD700" }} />
                  <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#FFD700" }} />
                  <div className="w-6 h-[1px]" style={{ background: "linear-gradient(90deg, #D4A843, transparent)" }} />
                </div>
              </div>
            </div>

            {/* CTA pill button */}
            <div className="mt-3 text-center">
              <span className="inline-block text-[11px] lg:text-[13px] font-bold tracking-[0.15em] uppercase px-6 py-2 rounded-full transition-all duration-300 group-hover:bg-[#FFD700]/15" style={{
                color: "#F5E17D",
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                border: "1.5px solid rgba(255,215,0,0.35)",
                boxShadow: "0 0 12px rgba(255,215,0,0.08)",
              }}>
                View Full Details →
              </span>
            </div>
          </div>
        </div>

        {/* ══════ PENNANT BOTTOM — dramatic pointed V with gold trim & tassel ══════ */}
        <svg viewBox="0 0 720 180" className="w-full block -mt-[1px]" preserveAspectRatio="none" style={{ height: "140px" }}>
          <defs>
            <linearGradient id="scrollBtmPennant" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#8B1003" />
              <stop offset="25%" stopColor="#7A0E03" />
              <stop offset="55%" stopColor="#6B0C02" />
              <stop offset="85%" stopColor="#5A0A02" />
              <stop offset="100%" stopColor="#4A0801" />
            </linearGradient>
            <linearGradient id="pennantGoldL" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#F5E17D" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#D4A843" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="pennantGoldR" x1="1" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#F5E17D" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#D4A843" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.7" />
            </linearGradient>
            <radialGradient id="pennantTip" cx="0.5" cy="0.3" r="0.5">
              <stop offset="0%" stopColor="#FFFDE7" />
              <stop offset="30%" stopColor="#F5E17D" />
              <stop offset="60%" stopColor="#D4A843" />
              <stop offset="100%" stopColor="#8B6914" />
            </radialGradient>
            <filter id="pennantShadow">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>
          {/* Left gold border strip */}
          <path d="M0 0 L8 0 L368 165 L360 170 Z" fill="url(#pennantGoldL)" />
          {/* Right gold border strip */}
          <path d="M720 0 L712 0 L352 165 L360 170 Z" fill="url(#pennantGoldR)" />
          {/* Main pennant V-shape */}
          <path
            d="M8 0 L712 0 L360 165 Z"
            fill="url(#scrollBtmPennant)"
            filter="url(#pennantShadow)"
          />
          {/* Center fold highlight */}
          <path d="M360 10 L360 165" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          {/* Gold tip ornament */}
          <circle cx="360" cy="170" r="6" fill="url(#pennantTip)" />
        </svg>

        {/* ══════ LEFT TASSEL — gently swings ══════ */}
        <div className="absolute -left-[10px] top-0 flex flex-col items-center" style={{
          animation: "scrollTasselSwing 4s ease-in-out 2s infinite",
          transformOrigin: "top center",
        }}>
          <div className="w-[10px] h-[60px] rounded-b-sm" style={{
            background: "linear-gradient(180deg, #E8A020 0%, #D43D0C 20%, #C5340C 45%, #A02808 70%, #8B1503 100%)",
            boxShadow: "2px 3px 8px rgba(0,0,0,0.35)",
          }} />
          <div className="w-[3px] h-[24px]" style={{ background: "linear-gradient(180deg, #A02808, #6B0E02)" }} />
          <div className="w-[14px] h-[14px] rounded-full" style={{
            background: "radial-gradient(circle at 35% 28%, #FFFDE7 0%, #F5E17D 25%, #D4A843 55%, #8B6914 100%)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.45), 0 0 8px rgba(245,225,125,0.15)",
          }} />
        </div>

        {/* ══════ RIGHT TASSEL ══════ */}
        <div className="absolute -right-[10px] top-0 flex flex-col items-center" style={{
          animation: "scrollTasselSwing 4s ease-in-out 2.5s infinite",
          transformOrigin: "top center",
        }}>
          <div className="w-[10px] h-[60px] rounded-b-sm" style={{
            background: "linear-gradient(180deg, #E8A020 0%, #D43D0C 20%, #C5340C 45%, #A02808 70%, #8B1503 100%)",
            boxShadow: "-2px 3px 8px rgba(0,0,0,0.35)",
          }} />
          <div className="w-[3px] h-[24px]" style={{ background: "linear-gradient(180deg, #A02808, #6B0E02)" }} />
          <div className="w-[14px] h-[14px] rounded-full" style={{
            background: "radial-gradient(circle at 35% 28%, #FFFDE7 0%, #F5E17D 25%, #D4A843 55%, #8B6914 100%)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.45), 0 0 8px rgba(245,225,125,0.15)",
          }} />
        </div>
      </div>
    </Link>
  );
}

const gradients = [
  "from-temple-maroon-deep via-temple-maroon to-temple-red-dark",
  "from-temple-maroon via-[#6B1A2A] to-temple-red-dark",
  "from-[#1A0B2E] via-temple-maroon to-temple-red-dark",
  "from-temple-red-dark via-temple-maroon to-temple-maroon-deep",
];

export function HeroSlideshow() {
  const slides = useSlideshowStore((s) => s.slides);
  const loading = useSlideshowStore((s) => s.loading);
  const fetchSlides = useSlideshowStore((s) => s.fetchSlides);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const activeSlides = slides
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slideCount = activeSlides.length || 1;

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(((index % slideCount) + slideCount) % slideCount);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [slideCount, isTransitioning]
  );

  const goNext = useCallback(() => goToSlide(currentIndex + 1), [currentIndex, goToSlide]);
  const goPrev = useCallback(() => goToSlide(currentIndex - 1), [currentIndex, goToSlide]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [isPaused, goNext, slideCount]);

  if (activeSlides.length === 0) {
    return (
      <section className="relative overflow-hidden h-full bg-gradient-to-br from-temple-maroon-deep via-temple-maroon to-temple-red-dark">
        <div className="relative mx-auto flex h-full items-end max-w-7xl px-6 pb-24 sm:px-8 lg:px-10">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
              Rudra Narayana Hindu Temple
            </h1>
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = activeSlides[currentIndex];
  const gradient = gradients[currentIndex % gradients.length];

  return (
    <section
      className="relative overflow-hidden h-full"
      aria-roledescription="carousel"
      aria-label="Temple highlights"
    >
      {/* Golden & White Rhombus Shimmer Lights */}
      <ShimmeringLights />

      {/* Hanging Panchangam Scroll — right side */}
      <HangingPanchangamScroll />

      {/* Slides */}
      <div className="relative h-full">
        {activeSlides.map((slide, index) => {
          const slideDescription = [slide.title, slide.subtitle]
            .map((part) => part?.trim())
            .filter(Boolean)
            .join(" — ");
          return (
          <div
            key={slide.id}
            className={`${
              index === currentIndex ? "relative h-full" : "absolute inset-0"
            } transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={
              slideDescription
                ? `Slide ${index + 1} of ${slideCount}: ${slideDescription}`
                : `Slide ${index + 1} of ${slideCount}`
            }
            aria-hidden={index !== currentIndex}
          >
            {/* Background */}
            {slide.type === "video" && slide.url ? (
              <div className="absolute inset-0">
                <video
                  src={slide.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              </div>
            ) : slide.url ? (
              <div
                className="absolute inset-0 bg-cover bg-top sm:bg-center"
                style={{ backgroundImage: `url(${slide.url})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              </div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
              </div>
            )}

            {/* Content — elegant, minimal overlay */}
            {slide.showText !== false && (
              <div className="relative mx-auto flex h-full items-end max-w-7xl px-6 pb-12 sm:px-8 sm:pb-20 lg:px-10 lg:pb-28">
                <div className="max-w-4xl">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl md:text-4xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                    {slide.title}
                  </h2>
                  <p className="mt-3 text-base sm:text-lg text-white/85 leading-relaxed font-accent max-w-xl" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
                    {slide.subtitle}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-temple-gold-light/70 italic tracking-[0.25em] font-accent" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>
                    &#x0964; DHARMO RAKSHATI RAKSHITAHA &#x0964;
                  </p>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {slideCount > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2.5 text-white backdrop-blur-sm border border-white/10 transition-all hover:bg-black/40 hover:border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/20 p-2.5 text-white backdrop-blur-sm border border-white/10 transition-all hover:bg-black/40 hover:border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots + Pause */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="rounded-full bg-black/20 p-1.5 text-white backdrop-blur-sm border border-white/10 transition-all hover:bg-black/40"
              aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="flex gap-2">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-temple-gold shadow-gold-glow"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
