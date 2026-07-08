"use client";

import { useEffect, useState } from "react";

/**
 * Scrolling "upcoming festivals" strip under the home action tiles
 * (client 07-08: "upcoming festival details scrolling here", next to the
 * Today's Panchangam tile).
 *
 * Dates are plain calendar dates in the temple's zone (America/Chicago).
 * Past festivals auto-hide; when none remain the strip renders nothing.
 * Update this list as the client sends new months.
 */
const FESTIVALS: Array<{ date: string; name: string }> = [
  { date: "2026-07-10", name: "Yogini Ekadashi" },
  { date: "2026-07-12", name: "Masa Shivaratri" },
  { date: "2026-07-14", name: "Ashadha Gupt Navratri begins" },
  { date: "2026-07-15", name: "Puri Jagannatha Ratha Yatra" },
  { date: "2026-07-24", name: "Devashayana Ekadashi (Toli Ekadashi)" },
  { date: "2026-07-29", name: "Guru Poornima" },
];

/** "2026-07-10" -> "Jul 10" (no Date parsing — avoids TZ off-by-one). */
function shortLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(m ?? 1) - 1]} ${d}`;
}

export function FestivalTicker() {
  // Computed after mount so the static export stays deterministic (no
  // build-day date baked in, no hydration mismatch).
  const [upcoming, setUpcoming] = useState<typeof FESTIVALS | null>(null);

  useEffect(() => {
    // Today's calendar date in the temple's zone, as "YYYY-MM-DD" — plain
    // string compare against the ISO festival dates.
    const todayCT = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
    }).format(new Date());
    setUpcoming(FESTIVALS.filter((f) => f.date >= todayCT));
  }, []);

  if (!upcoming || upcoming.length === 0) return null;

  // Client 07-08 styling pass: red background + white text so the strip
  // stands out, plain readable font, bigger date text.
  const items = upcoming.map((f) => (
    <span key={f.date + f.name} className="mx-6 inline-flex items-baseline gap-2.5 whitespace-nowrap">
      <span className="text-base font-bold text-white">
        {shortLabel(f.date)}
      </span>
      <span className="text-base font-medium text-white/95">{f.name}</span>
      <span aria-hidden="true" className="ml-3 text-white/60">
        &#x2726;
      </span>
    </span>
  ));

  return (
    <section
      aria-label="Upcoming festivals"
      className="border-y border-temple-gold/40 bg-gradient-to-r from-[#8f1028] via-[#b3152f] to-[#8f1028]"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <span className="flex-shrink-0 text-xs font-bold uppercase tracking-[0.2em] text-white">
          &#x1FA94; Upcoming Festivals
        </span>
        <div className="relative flex-1 overflow-hidden" role="marquee">
          {/* Track holds the list twice for a seamless -50% loop. */}
          <div className="festival-ticker-track flex w-max items-center">
            <div className="flex items-center">{items}</div>
            <div className="flex items-center" aria-hidden="true">
              {items}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
