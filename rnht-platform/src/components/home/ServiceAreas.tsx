import { MapPin } from "lucide-react";

const cities = [
  "Austin",
  "Kyle",
  "Manor",
  "Round Rock",
  "Lakeway",
  "Bee Cave",
  "Leander",
  "Dripping Springs",
  "San Antonio",
  "Dallas",
  "Houston",
  "Lago Vista",
  "Liberty Hill",
  "Avery Ranch",
  "Steiner Ranch",
];

/**
 * "Serving All of Texas" strip — list of cities our priests travel to.
 * Used on both `/` and `/services`.
 */
export function ServiceAreas() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-[#FFF8E7]/50 overflow-hidden section-gold-border">
      <div className="gold-particles" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20">
            <MapPin className="h-7 w-7 text-temple-gold" />
          </div>
          <h2 className="mt-4 section-heading">Serving All of Texas and USA</h2>
          <div className="ornament-divider"><span>&#x2733;</span></div>
          <p className="mx-auto max-w-xl text-gray-600 font-accent text-lg">
            Our priests travel to your home, office, or venue across the greater Texas area
          </p>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2 sm:gap-3">
          {cities.map((city) => (
            <span
              key={city}
              className="rounded-full bg-temple-cream border border-temple-gold/15 px-5 py-2 text-sm font-medium text-temple-maroon transition-all hover:bg-temple-gold/10 hover:border-temple-gold/30"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
