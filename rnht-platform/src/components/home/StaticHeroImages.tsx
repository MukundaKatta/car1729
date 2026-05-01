import Image from "next/image";
import Link from "next/link";

type StaticImage = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  imageClassName?: string;
};

const images: StaticImage[] = [
  {
    src: "/gallery/gallery-05.jpg",
    alt: "Shiva lingam adorned with flowers and temple offerings",
    title: "Temple Rituals",
    subtitle: "Daily darshan and sacred offerings",
    imageClassName: "object-[26%_34%]",
  },
  {
    src: "/gallery/gallery-07.jpg",
    alt: "RNHT priests standing beside deity idols",
    title: "Priest Guidance",
    subtitle: "Experienced Vedic priests serving families across Texas",
    imageClassName: "object-[58%_30%]",
  },
  {
    src: "/gallery/gallery-14.jpg",
    alt: "Hanuman deity with abhishekam",
    title: "Hanuman Darshan",
    subtitle: "Devotion, strength, and sacred presence",
    imageClassName: "object-center",
  },
  {
    src: "/gallery/gallery-16.jpg",
    alt: "Shiva Lingam with floral decoration",
    title: "Sacred Alankaram",
    subtitle: "Fresh flowers and traditional temple adornment",
    imageClassName: "object-center",
  },
  {
    src: "/gallery/gallery-23.jpg",
    alt: "Ram Parivar celebration with mandapam",
    title: "Festival Moments",
    subtitle: "Celebrations that gather the community in prayer",
    imageClassName: "object-center",
  },
  {
    src: "/gallery/gallery-24.jpg",
    alt: "Deity adorned with roses and jewels",
    title: "Divine Decor",
    subtitle: "Garlands, jewels, and offerings prepared with care",
    imageClassName: "object-center",
  },
];

export function StaticHeroImages() {
  return (
    <section
      className="relative overflow-hidden border-y border-temple-gold/15"
      style={{
        background:
          "linear-gradient(180deg, #2C0611 0%, #3E0816 42%, #22040D 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,213,163,0.1),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_52%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="font-accent text-[11px] font-semibold uppercase tracking-[0.28em] sm:text-xs"
            style={{ color: "#e6ca87" }}
          >
            Darshan and Devotion
          </p>
          <h2
            className="mt-3 font-heading text-[1.85rem] font-bold leading-tight sm:text-[2.2rem] lg:text-[2.45rem]"
            style={{ color: "#fffaf4" }}
          >
            Sacred Moments Across the Temple
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: "rgba(255, 244, 232, 0.82)" }}
          >
            Daily rituals, divine alankaram, festival scenes, and priest-led
            worship captured without the heavy crop.
          </p>
        </div>

        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {images.map((img) => (
            <Link
              key={img.src}
              href="/gallery"
              className="group mb-4 block break-inside-avoid overflow-hidden rounded-[8px] border border-temple-gold/15 bg-[rgba(31,5,12,0.86)] shadow-[0_18px_48px_rgba(10,2,7,0.28)] transition-transform duration-300 hover:-translate-y-1 hover:border-temple-gold/35 hover:shadow-[0_24px_60px_rgba(10,2,7,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C0611]"
              aria-label={`Open gallery from ${img.title}`}
            >
              <div className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-3 py-3">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={900}
                  height={1100}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className={`h-auto max-h-[28rem] w-full rounded-[6px] object-contain transition-transform duration-500 group-hover:scale-[1.02] ${img.imageClassName ?? "object-center"}`}
                />
              </div>
              <div className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(34,6,13,0.98),rgba(20,4,10,0.98))] px-4 py-4 sm:px-5">
                <p
                  className="font-accent text-[10px] font-semibold uppercase tracking-[0.26em] sm:text-[11px]"
                  style={{ color: "#e6ca87" }}
                >
                  {img.title}
                </p>
                <p
                  className="mt-2 text-sm font-medium leading-relaxed sm:text-[15px]"
                  style={{ color: "#fff7ef" }}
                >
                  {img.subtitle}
                </p>
                <p
                  className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors group-hover:text-[#f5d790]"
                  style={{ color: "rgba(230, 202, 135, 0.84)" }}
                >
                  View in Gallery
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-3 rounded-full border border-temple-gold/30 bg-[rgba(255,255,255,0.05)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#fff7ef] transition-colors hover:border-temple-gold/60 hover:bg-[rgba(255,255,255,0.08)]"
          >
            Explore Full Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
