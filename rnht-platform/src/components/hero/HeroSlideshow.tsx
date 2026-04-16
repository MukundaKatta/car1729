"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

/**
 * Three-panel Ken Burns hero — deity-collage.jpg (2200 × 1049, optimized).
 *
 * object-position values (viewport-independent):
 *   Left  (Shiva lingam)    →  5% center
 *   Mid   (Goddess Lakshmi) → 50% center
 *   Right (Narayana)        → 95% center
 *
 * Animation philosophy — "Sacred Convergence":
 *   • ONE shared keyframe and ONE duration for all panels → frame-perfect sync
 *   • Zero delays → all start together on page load
 *   • Small per-panel offsets keep the composition balanced without breaking sync
 *   • Scale 1.015 → 1.075 for a richer, gallery-like drift
 *   • Sinusoidal easing (cubic-bezier 0.37 0 0.63 1) → organic, meditative
 *   • Dividers and overlays stay restrained so the collage reads as one premium scene
 *   • GPU-only properties (transform, opacity) → silky 60 fps
 */

const PANELS = [
  {
    objectPos: "5% 20%",
    label: "Shiva lingam adorned with flowers",
    style: {
      "--drift-x-start": "1.4%",
      "--drift-x-end": "-0.6%",
      "--drift-y-start": "0.8%",
      "--drift-y-end": "-0.5%",
      "--panel-overlay": "rgba(34, 10, 18, 0.24)",
    } as CSSProperties,
  },
  {
    objectPos: "50% center",
    label: "Goddess Lakshmi in full regalia",
    style: {
      "--drift-x-start": "0%",
      "--drift-x-end": "0%",
      "--drift-y-start": "0.7%",
      "--drift-y-end": "-0.7%",
      "--panel-overlay": "rgba(89, 38, 18, 0.12)",
    } as CSSProperties,
  },
  {
    objectPos: "95% 30%",
    label: "Narayana with garlands",
    style: {
      "--drift-x-start": "-1.4%",
      "--drift-x-end": "0.6%",
      "--drift-y-start": "0.8%",
      "--drift-y-end": "-0.5%",
      "--panel-overlay": "rgba(34, 10, 18, 0.24)",
    } as CSSProperties,
  },
] as const;

const CSS = `
  /* ── Shared timing ─────────────────────────────────────────────────── */
  :root {
    --sacred-duration : 18s;
    --sacred-ease     : cubic-bezier(0.37, 0, 0.63, 1);   /* sinusoidal */
  }

  /* ── Panel Ken Burns ────────────────────────────────────────────────── */
  @keyframes sacred-panel {
    0%   { transform: scale(1.015) translate(var(--drift-x-start), var(--drift-y-start)); }
    100% { transform: scale(1.075) translate(var(--drift-x-end), var(--drift-y-end)); }
  }

  .sacred-panel {
    animation-duration        : var(--sacred-duration);
    animation-timing-function : var(--sacred-ease);
    animation-iteration-count : infinite;
    animation-direction       : alternate;
    animation-delay           : 0s;
    animation-name            : sacred-panel;
    will-change               : transform;
  }

/* ── CTA gold button — gentle outer glow pulse ──────────────────────── */
  @keyframes cta-glow {
    0%   { box-shadow: 0 6px 24px rgba(197,151,62,0.35), inset 0 1px 0 rgba(255,255,255,0.25); }
    50%  { box-shadow: 0 6px 40px rgba(197,151,62,0.60), inset 0 1px 0 rgba(255,255,255,0.35); }
    100% { box-shadow: 0 6px 24px rgba(197,151,62,0.35), inset 0 1px 0 rgba(255,255,255,0.25); }
  }
  .cta-primary-glow {
    animation: cta-glow 4s ease-in-out infinite;
  }

  /* ── Top border shimmer ─────────────────────────────────────────────── */
  @keyframes border-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .border-shimmer {
    background: linear-gradient(
      90deg,
      rgba(197,151,62,0)   0%,
      rgba(197,151,62,0.3) 20%,
      rgba(232,213,163,1)  50%,
      rgba(197,151,62,0.3) 80%,
      rgba(197,151,62,0)   100%
    );
    background-size: 200% 100%;
    animation: border-shimmer 4s linear infinite;
  }

  .hero-divider {
    background: linear-gradient(
      to bottom,
      rgba(232, 213, 163, 0.04) 0%,
      rgba(232, 213, 163, 0.35) 18%,
      rgba(197, 151, 62, 0.45) 50%,
      rgba(232, 213, 163, 0.35) 82%,
      rgba(232, 213, 163, 0.04) 100%
    );
    box-shadow:
      0 0 24px rgba(197, 151, 62, 0.22),
      0 0 1px rgba(255, 255, 255, 0.28);
  }
`;

export function HeroSlideshow() {
  return (
    <>
      <style>{CSS}</style>

      <section className="relative z-[2] w-full h-[75vh] sm:h-screen overflow-hidden bg-[#2A0612]">

        {/* Shimmering gold top border */}
        <div className="border-shimmer absolute top-0 inset-x-0 h-[3px] z-30" />

        {/* ── Three panels — all on sm+, center only on mobile ─────── */}
        <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-3">
          {PANELS.map((panel, i) => (
            <div
              key={i}
              className={`relative overflow-hidden ${i !== 1 ? "hidden sm:block" : ""}`}
              style={panel.style}
            >

              {/* Ken Burns layer */}
              <div className="sacred-panel absolute inset-0">
                <Image
                  src="/deity-collage.jpg"
                  alt={panel.label}
                  fill
                  className="object-cover"
                  style={{ objectPosition: panel.objectPos }}
                  sizes="34vw"
                  quality={95}
                  priority={i === 1}
                />
              </div>

              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    "linear-gradient(to top, rgba(24, 5, 12, 0.18) 0%, var(--panel-overlay) 52%, rgba(14, 4, 10, 0.1) 100%)",
                }}
              />

              {/* Inner edge shadow — blends panels toward center */}
              {i === 0 && (
                <div
                  className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10"
                  style={{ background: "linear-gradient(to right, transparent, rgba(42,6,18,0.58))" }}
                />
              )}
              {i === 2 && (
                <div
                  className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10"
                  style={{ background: "linear-gradient(to left, transparent, rgba(42,6,18,0.58))" }}
                />
              )}

              {i < PANELS.length - 1 && (
                <div className="hero-divider absolute inset-y-0 right-0 z-20 hidden w-px sm:block" />
              )}

            </div>
          ))}
        </div>

        {/* ── Overlays ──────────────────────────────────────────────── */}

        {/* Cinematic bottom fade — deep and rich */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
          style={{
            height: "45%",
            background: "linear-gradient(to top, rgba(42,6,18,0.95) 0%, rgba(42,6,18,0.65) 40%, rgba(42,6,18,0.15) 75%, transparent 100%)",
          }}
        />

        {/* Subtle top vignette */}
        <div
          className="absolute inset-x-0 top-0 h-20 z-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(42,6,18,0.25), transparent)" }}
        />

        {/* Corner vignettes for cinematic depth */}
        <div className="absolute inset-0 z-20 pointer-events-none"
          style={{ boxShadow: "inset 0 0 120px rgba(42,6,18,0.45)" }}
        />

        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(232,213,163,0.08) 0%, rgba(42,6,18,0) 38%), linear-gradient(90deg, rgba(42,6,18,0.28) 0%, rgba(42,6,18,0.08) 22%, rgba(42,6,18,0.02) 50%, rgba(42,6,18,0.08) 78%, rgba(42,6,18,0.28) 100%)",
          }}
        />

        {/* ── CTA Buttons ───────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-10 sm:bottom-16 lg:bottom-20 z-30">
          <div className="flex justify-center gap-3 sm:gap-8">
            <Link
              href="/services"
              className="cta-primary-glow px-6 sm:px-14 py-3.5 sm:py-4 text-sm sm:text-lg font-bold tracking-wide transition-all duration-300 hover:scale-[1.04] hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #B8872E 0%, #E8D5A3 45%, #C5973E 100%)",
                color: "#2A0612",
                borderRadius: "4px",
              }}
            >
              Book a Pooja
            </Link>
            <Link
              href="/donate"
              className="px-6 sm:px-14 py-3.5 sm:py-4 text-sm sm:text-lg font-bold tracking-wide transition-all duration-300 hover:scale-[1.04]"
              style={{
                background: "rgba(42,6,18,0.35)",
                color: "#E8D5A3",
                border: "1.5px solid rgba(197,151,62,0.70)",
                borderRadius: "4px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 24px rgba(197,151,62,0.15), inset 0 0 24px rgba(197,151,62,0.06)",
              }}
            >
              Donate
            </Link>
          </div>
        </div>

      </section>
    </>
  );
}
