"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Testimonial = {
  name: string;
  location: string;
  text: string;
};

function chunkTestimonials(testimonials: Testimonial[], size: number) {
  const chunks: Testimonial[][] = [];

  for (let index = 0; index < testimonials.length; index += size) {
    chunks.push(testimonials.slice(index, index + size));
  }

  return chunks;
}

export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const pages = chunkTestimonials(testimonials, 3);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;

    const interval = window.setInterval(() => {
      setActivePage((current) => (current + 1) % pages.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [pages.length]);

  const goToPage = (pageIndex: number) => {
    setActivePage(pageIndex);
  };

  const goToPrevious = () => {
    setActivePage((current) => (current - 1 + pages.length) % pages.length);
  };

  const goToNext = () => {
    setActivePage((current) => (current + 1) % pages.length);
  };

  return (
    <div className="mt-12">
      <div className="relative overflow-hidden" aria-label="Devotee testimonials" aria-roledescription="carousel">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activePage * 100}%)` }}
        >
          {pages.map((page, pageIndex) => (
            <div
              key={`testimonial-page-${pageIndex}`}
              className="min-w-full"
              aria-hidden={pageIndex !== activePage}
            >
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {page.map((testimonial) => (
                  <article
                    key={`${testimonial.name}-${testimonial.location}`}
                    className="group relative flex min-h-[25rem] flex-col rounded-[2rem] border border-temple-gold/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.035)_100%)] p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-temple-gold/35 hover:bg-white/10 hover:shadow-[0_0_36px_rgba(197,151,62,0.16)]"
                  >
                    <div className="pointer-events-none absolute left-4 top-4 h-12 w-12 rounded-tl-2xl border-l-2 border-t-2 border-temple-gold/30" />
                    <div className="pointer-events-none absolute bottom-4 right-4 h-12 w-12 rounded-br-2xl border-b-2 border-r-2 border-temple-gold/30" />

                    <Quote className="h-9 w-9 text-temple-gold/70" />

                    <p className="mt-5 flex-1 font-accent text-[15px] leading-10 text-gray-200 italic sm:text-[16px]">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>

                    <div className="mt-8 border-t border-white/10 pt-5">
                      <p className="font-heading text-2xl font-semibold text-white">
                        {testimonial.name}
                      </p>
                      <p className="mt-1 text-sm tracking-[0.14em] text-temple-gold-light/90 uppercase">
                        {testimonial.location}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {pages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous testimonials"
              className="absolute left-0 top-1/2 hidden -translate-y-1/2 rounded-full border border-temple-gold/25 bg-[#5d1020]/85 p-3 text-temple-gold-light shadow-[0_14px_28px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-temple-gold/50 hover:bg-[#6d1527] hover:text-white lg:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next testimonials"
              className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-full border border-temple-gold/25 bg-[#5d1020]/85 p-3 text-temple-gold-light shadow-[0_14px_28px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-temple-gold/50 hover:bg-[#6d1527] hover:text-white lg:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {pages.length > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          {pages.map((_, pageIndex) => {
            const isActive = pageIndex === activePage;

            return (
              <button
                key={`testimonial-dot-${pageIndex}`}
                type="button"
                onClick={() => goToPage(pageIndex)}
                aria-label={`Show testimonial group ${pageIndex + 1}`}
                aria-pressed={isActive}
                className={`h-3 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-10 bg-temple-gold shadow-[0_0_18px_rgba(197,151,62,0.45)]"
                    : "w-3 bg-white/25 hover:bg-white/45"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
