"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Three-panel Ken Burns hero — deity-collage.jpg (2200 × 1049, optimized).
 *
 * object-position values (viewport-independent):
 *   Left  (Goddess Lakshmi) → 50% center
 *   Mid   (Shiva lingam)    →  5% center
 *   Right (Narayana)        → 95% center
 *
 * Animation philosophy — "Sacred Convergence":
 *   • ONE duration (20 s) for all three panels → perfect perpetual sync
 *   • Zero delays → all start together on page load
 *   • Complementary motion: side panels drift inward while center rises,
 *     creating a unified "breath" that draws the eye toward the deities
 *   • Scale 1.00 → 1.055 (subtle luxury, not cheap over-zoom)
 *   • Sinusoidal easing (cubic-bezier 0.37 0 0.63 1) → organic, meditative
 *   • Gold dividers pulse on the same 20 s heartbeat
 *   • GPU-only properties (transform, opacity) → silky 60 fps
 */

const PANELS = [
  { objectPos: "50% center", anim: "sacred-left",   label: "Goddess Lakshmi in full regalia"   },
  { objectPos: "5%  20%",    anim: "sacred-center",  label: "Shiva lingam adorned with flowers" },
  { objectPos: "95% 30%",    anim: "sacred-right",   label: "Narayana with garlands"            },
] as const;

const CSS = `
  /* ── Shared timing ─────────────────────────────────────────────────── */
  :root {
    --sacred-duration : 20s;
    --sacred-ease     : cubic-bezier(0.37, 0, 0.63, 1);   /* sinusoidal */
  }

  /* ── Panel Ken Burns ────────────────────────────────────────────────── */

  /* Left: zoom in + drift inward (rightward) + slight upward */
  @keyframes sacred-left {
    0%   { transform: scale(1.000) translate( 0.8%,  0.5%); }
    100% { transform: scale(1.055) translate(-0.3%, -0.3%); }
  }

  /* Center: zoom in + rise — the focal deity ascends */
  @keyframes sacred-center {
    0%   { transform: scale(1.000) translate(0%,  0.6%); }
    100% { transform: scale(1.060) translate(0%, -0.4%); }
  }

  /* Right: zoom in + drift inward (leftward) + slight upward */
  @keyframes sacred-right {
    0%   { transform: scale(1.000) translate(-0.8%,  0.5%); }
    100% { transform: scale(1.055) translate( 0.3%, -0.3%); }
  }

  .sacred-left,
  .sacred-center,
  .sacred-right {
    animation-duration        : var(--sacred-duration);
    animation-timing-function : var(--sacred-ease);
    animation-iteration-count : infinite;
    animation-direction       : alternate;
    animation-delay           : 0s;
    will-change               : transform;
  }
  .sacred-left   { animation-name: sacred-left;   }
  .sacred-center { animation-name: sacred-center; }
  .sacred-right  { animation-name: sacred-right;  }

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
            <div key={i} className={`relative overflow-hidden ${i !== 1 ? "hidden sm:block" : ""}`}>

              {/* Ken Burns layer */}
              <div className={`absolute inset-0 ${panel.anim}`}>
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

              {/* Side panel warm-dark tint — very subtle depth cue */}
              {i !== 1 && (
                <div className="absolute inset-0 bg-[#2A0612]/12 pointer-events-none z-10" />
              )}

              {/* Inner edge shadow — blends panels toward center */}
              {i === 0 && (
                <div
                  className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10"
                  style={{ background: "linear-gradient(to right, transparent, rgba(42,6,18,0.65))" }}
                />
              )}
              {i === 2 && (
                <div
                  className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10"
                  style={{ background: "linear-gradient(to left, transparent, rgba(42,6,18,0.65))" }}
                />
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
