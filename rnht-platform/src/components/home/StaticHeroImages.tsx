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
          "linear-gradient(180deg, #2C0611 0%, #3E0816 42%, #22040D 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,213,163,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_52%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-accent text-[11px] font-semibold uppercase tracking-[0.28em] text-temple-gold-light/95 sm:text-xs">
            Darshan and Devotion
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.7rem]">
            Beauty, Ritual, and Blessings at the Heart of RNHT
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/72 sm:text-base">
            Sacred darshan, graceful Lakshmi alankaram, and priest-led guidance
            woven into one serene temple experience.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:gap-5 lg:grid-cols-12">
          {images.map((img, index) => (
            <div
              key={img.src}
              className={`group relative overflow-hidden rounded-[8px] border border-temple-gold/15 bg-black/20 shadow-[0_22px_60px_rgba(10,2,7,0.34)] ${img.className}`}
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
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,2,7,0.94)_0%,rgba(18,4,10,0.58)_32%,rgba(18,4,10,0.16)_62%,rgba(18,4,10,0.04)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="rounded-[6px] border border-white/10 bg-[linear-gradient(180deg,rgba(35,8,16,0.16),rgba(17,4,9,0.58))] p-4 backdrop-blur-[3px]">
                    <p className="font-accent text-[10px] font-semibold uppercase tracking-[0.26em] text-temple-gold-light/95 sm:text-[11px]">
                    {img.title}
                    </p>
                    <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white sm:text-[15px]">
                      {img.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
