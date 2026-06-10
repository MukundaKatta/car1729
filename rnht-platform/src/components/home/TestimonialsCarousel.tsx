"use client";

import { useEffect, useRef, useState } from "react";
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
  // 1 card per page on phones (3 stacked cards per page was ~3 screen-heights
  // that swapped out mid-read); 3 per page from `sm` up.
  const [perPage, setPerPage] = useState(3);
  const [activePage, setActivePage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      setPerPage(mq.matches ? 3 : 1);
      setActivePage(0);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const pages = chunkTestimonials(testimonials, perPage);

  // Pause auto-advance while the section is off-screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (pages.length <= 1 || paused || !inView) return;

    const interval = window.setInterval(() => {
      setActivePage((current) => (current + 1) % pages.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [pages.length, paused, inView]);

  // Any manual interaction stops the auto-rotation — content should never
  // swap out from under a reader again.
  const interact = (fn: () => void) => {
    setPaused(true);
    fn();
  };

  const goToPage = (pageIndex: number) => setActivePage(pageIndex);
  const goToPrevious = () =>
    setActivePage((current) => (current - 1 + pages.length) % pages.length);
  const goToNext = () =>
    setActivePage((current) => (current + 1) % pages.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    interact(dx < 0 ? goToNext : goToPrevious);
  };

  return (
    <div className="mt-12" ref={rootRef}>
      <div
        className="relative overflow-hidden"
        aria-label="Devotee testimonials"
        aria-roledescription="carousel"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
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
              <div className="grid gap-6 px-1 sm:grid-cols-2 sm:px-0 xl:grid-cols-3">
                {page.map((testimonial) => (
                  <article
                    key={`${testimonial.name}-${testimonial.location}`}
                    className="group relative flex flex-col rounded-[2rem] border border-temple-gold/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.035)_100%)] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-temple-gold/35 hover:bg-white/10 hover:shadow-[0_0_36px_rgba(197,151,62,0.16)] sm:min-h-[25rem] sm:p-8"
                  >
                    <div className="pointer-events-none absolute left-4 top-4 h-12 w-12 rounded-tl-2xl border-l-2 border-t-2 border-temple-gold/30" />
                    <div className="pointer-events-none absolute bottom-4 right-4 h-12 w-12 rounded-br-2xl border-b-2 border-r-2 border-temple-gold/30" />

                    <Quote className="h-9 w-9 text-temple-gold/70" />

                    <p className="mt-5 flex-1 font-accent text-[15px] leading-relaxed text-gray-200 italic sm:text-[16px] sm:leading-10">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>

                    <div className="mt-6 border-t border-white/10 pt-5 sm:mt-8">
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
              onClick={() => interact(goToPrevious)}
              aria-label="Previous testimonials"
              className="absolute left-0 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-temple-gold/25 bg-[#5d1020]/85 text-temple-gold-light shadow-[0_14px_28px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-temple-gold/50 hover:bg-[#6d1527] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => interact(goToNext)}
              aria-label="Next testimonials"
              className="absolute right-0 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-temple-gold/25 bg-[#5d1020]/85 text-temple-gold-light shadow-[0_14px_28px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-temple-gold/50 hover:bg-[#6d1527] hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {pages.length > 1 ? (
        <div className="mt-6 flex items-center justify-center">
          {pages.map((_, pageIndex) => {
            const isActive = pageIndex === activePage;

            return (
              <button
                key={`testimonial-dot-${pageIndex}`}
                type="button"
                onClick={() => interact(() => goToPage(pageIndex))}
                aria-label={`Show testimonial group ${pageIndex + 1}`}
                aria-pressed={isActive}
                className="flex min-h-[44px] min-w-[28px] items-center justify-center px-1"
              >
                <span
                  className={`block h-3 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-10 bg-temple-gold shadow-[0_0_18px_rgba(197,151,62,0.45)]"
                      : "w-3 bg-white/25 hover:bg-white/45"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
