"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Accessible image carousel for service galleries (client-provided photos).
 *
 * - Crossfades between images; respects prefers-reduced-motion.
 * - Prev/next arrows + dot indicators + "n / N" counter shown only when there
 *   is more than one image.
 * - Touch-swipe on mobile, ArrowLeft/ArrowRight when focused.
 * - `onImageClick` (card usage) makes the active image a button that opens the
 *   detail modal; arrows/dots stopPropagation so they never trigger it. The
 *   controls are DOM siblings of the image button (never nested) to keep ARIA
 *   valid.
 * - With 0 images it renders the category-icon placeholder instead.
 */
export function ServiceCarousel({
  images,
  alt,
  variant,
  onImageClick,
  fallbackIcon,
}: {
  images: string[];
  alt: string;
  variant: "card" | "modal";
  onImageClick?: () => void;
  fallbackIcon?: string;
}) {
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  // Clamp if the image list ever shrinks.
  useEffect(() => {
    if (active > count - 1) setActive(Math.max(0, count - 1));
  }, [count, active]);

  const go = useCallback(
    (dir: number) => setActive((i) => (count ? (i + dir + count) % count : 0)),
    [count],
  );

  const heightClass = variant === "card" ? "h-40" : "h-64 sm:h-80";

  if (count === 0) {
    return (
      <div
        className={`flex ${heightClass} w-full items-center justify-center bg-gradient-to-br from-temple-cream to-temple-gold/20`}
      >
        <span className="text-5xl opacity-60">{fallbackIcon ?? "🙏"}</span>
      </div>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null || count < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const ImageLayer = (
    <>
      {images.map((src, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={src}
          src={src}
          alt={count > 1 ? `${alt} — photo ${i + 1} of ${count}` : alt}
          loading={i === 0 ? "eager" : "lazy"}
          aria-hidden={i !== active}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );

  return (
    <div
      className={`group/carousel relative w-full overflow-hidden ${heightClass} bg-temple-maroon-deep`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${alt} image gallery`}
      tabIndex={variant === "modal" && count > 1 ? 0 : undefined}
    >
      {/* Active image: a button that opens the modal in card usage, else static. */}
      {onImageClick ? (
        <button
          type="button"
          onClick={onImageClick}
          aria-label={`View details for ${alt}`}
          className="absolute inset-0 h-full w-full cursor-pointer"
        >
          {ImageLayer}
        </button>
      ) : (
        ImageLayer
      )}

      {count > 1 && (
        <>
          {/* Counter — top-left so it never collides with the modal's
              top-right close button. */}
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
            {active + 1} / {count}
          </span>

          {/* Prev / Next */}
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className={`absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-opacity hover:bg-black/70 ${
              variant === "card"
                ? "opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100"
                : "opacity-100"
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className={`absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-opacity hover:bg-black/70 ${
              variant === "card"
                ? "opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100"
                : "opacity-100"
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === active}
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
