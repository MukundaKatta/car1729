import Image from "next/image";

type StaticImage = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  objectPosition?: string;
  className: string;
  aspectClass: string;
};

const images: StaticImage[] = [
  {
    src: "/gallery/gallery-05.jpg",
    alt: "Shiva lingam adorned with flowers and temple offerings",
    title: "Temple Rituals",
    subtitle: "Daily darshan and sacred offerings",
    objectPosition: "22% center",
    className: "lg:col-span-3",
    aspectClass: "aspect-[4/5]",
  },
  {
    src: "/gallery/gallery-08.jpg",
    alt: "Goddess Lakshmi beautifully adorned with jewelry and flowers",
    title: "Goddess Lakshmi",
    subtitle: "Grace, abundance, and blessings at the heart of the temple",
    objectPosition: "50% 26%",
    className: "lg:col-span-6",
    aspectClass: "aspect-[5/4] sm:aspect-[16/10]",
  },
  {
    src: "/gallery/gallery-07.jpg",
    alt: "RNHT priests standing beside deity idols",
    title: "Priest Guidance",
    subtitle: "Experienced Vedic priests serving families across Texas",
    objectPosition: "60% center",
    className: "lg:col-span-3",
    aspectClass: "aspect-[4/5]",
  },
];

export function StaticHeroImages() {
  return (
    <section
      className="relative overflow-hidden border-y border-temple-gold/15"
      style={{
        background:
          "linear-gradient(180deg, #350714 0%, #4A0818 48%, #2D0612 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,213,163,0.08),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-accent text-[11px] font-semibold uppercase tracking-[0.28em] text-temple-gold-light sm:text-xs">
            Darshan and Devotion
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl lg:text-[2.9rem]">
            A Temple Experience Rooted in Beauty, Ritual, and Blessings
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/78 sm:text-base">
            From daily darshan to priest-led ceremonies, every moment at RNHT is
            shaped with reverence, warmth, and care for devotees.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-12">
          {images.map((img, index) => (
            <div
              key={img.src}
              className={`group relative overflow-hidden rounded-[8px] border border-temple-gold/20 bg-black/20 shadow-[0_18px_50px_rgba(18,4,10,0.34)] ${img.className}`}
            >
              <div className={`relative ${img.aspectClass}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={
                    index === 1
                      ? "(min-width: 1024px) 50vw, 100vw"
                      : "(min-width: 1024px) 25vw, 100vw"
                  }
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  style={{
                    objectPosition: img.objectPosition,
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,4,10,0.82)_0%,rgba(18,4,10,0.38)_42%,rgba(18,4,10,0.08)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.26em] text-temple-gold-light/90 sm:text-[11px]">
                    {img.title}
                  </p>
                  <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/88 sm:text-[15px]">
                    {img.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
