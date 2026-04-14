import Image from "next/image";

/**
 * Static image collage for the home page. Replaces the animated
 * FallingPetals layer and gives the temple a calm, devotional feel.
 *
 * Drop images into /public/home/ and update the `images` list below.
 * Missing files fall back to a burgundy gradient block.
 */

type StaticImage = {
  src: string;
  alt: string;
};

// Uses the existing gallery assets so this section renders even before
// dedicated hero images are dropped into /public/home/. Swap the paths
// (e.g. /home/temple-1.jpg) once you have the right hero photography.
const images: StaticImage[] = [
  { src: "/gallery/gallery-05.jpg", alt: "Deity adorned with garlands for darshan" },
  { src: "/gallery/gallery-07.jpg", alt: "RNHT priests with deity idols" },
  { src: "/gallery/gallery-08.jpg", alt: "Goddess Lakshmi beautifully adorned" },
];

export function StaticHeroImages() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #4A0818 0%, #5E0A1F 40%, #4A0818 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-[0.06] bg-gold-shimmer" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold-light">
            Rudra Narayana Hindu Temple
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">
            A Sacred Space for Every Devotee
          </h2>
          <div className="mt-3 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-temple-gold/60" />
            <span className="text-temple-gold text-sm">&#x0950;</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-temple-gold/60" />
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.src}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-temple-gold/30 bg-temple-maroon/40"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
