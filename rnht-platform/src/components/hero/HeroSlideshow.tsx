"use client";

import Image from "next/image";
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
    objectPos: "50% 18%",
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

      <section className="relative z-[2] h-[100svh] w-full overflow-hidden bg-[#2A0612] sm:h-screen">

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
            height: "28%",
            background: "linear-gradient(to top, rgba(42,6,18,0.72) 0%, rgba(42,6,18,0.22) 58%, transparent 100%)",
          }}
        />

        {/* Subtle top vignette */}
        <div
          className="absolute inset-x-0 top-0 h-20 z-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(42,6,18,0.18), transparent)" }}
        />

        {/* Corner vignettes for cinematic depth */}
        <div className="absolute inset-0 z-20 pointer-events-none"
          style={{ boxShadow: "inset 0 0 100px rgba(42,6,18,0.32)" }}
        />

        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(232,213,163,0.06) 0%, rgba(42,6,18,0) 38%), linear-gradient(90deg, rgba(42,6,18,0.2) 0%, rgba(42,6,18,0.05) 22%, rgba(42,6,18,0.01) 50%, rgba(42,6,18,0.05) 78%, rgba(42,6,18,0.2) 100%)",
          }}
        />

      </section>
    </>
  );
}
