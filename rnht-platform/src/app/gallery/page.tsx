"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { pushOverlay } from "@/lib/overlay-stack";

const galleryImages = [
  { src: "/gallery/gallery-01.jpg", alt: "Priest conducting ceremony with family", category: "Ceremonies" },
  { src: "/gallery/gallery-02.jpg", alt: "Priest performing pooja at mandapam", category: "Ceremonies" },
  { src: "/gallery/gallery-03.jpg", alt: "Priest with Ganesha idol and decorations", category: "Ceremonies" },
  { src: "/gallery/gallery-04.jpg", alt: "Priest blessing devotees at community event", category: "Community" },
  { src: "/gallery/gallery-05.jpg", alt: "Deity with garlands and green backdrop", category: "Darshan" },
  { src: "/gallery/gallery-06.jpg", alt: "Devotee performing abhishekam at temple", category: "Ceremonies" },
  { src: "/gallery/gallery-07.jpg", alt: "Both priests seated with deity idols", category: "Priests" },
  { src: "/gallery/gallery-08.jpg", alt: "Goddess Lakshmi beautifully adorned", category: "Darshan" },
  { src: "/gallery/gallery-09.jpg", alt: "Goddess with floral decorations", category: "Darshan" },
  { src: "/gallery/gallery-10.jpg", alt: "Wedding ceremony with priest and couple", category: "Weddings" },
  { src: "/gallery/gallery-11.jpg", alt: "Colorful pooja materials and offerings", category: "Ceremonies" },
  { src: "/gallery/gallery-12.jpg", alt: "Home pooja with family and Ganesh backdrop", category: "Home Services" },
  { src: "/gallery/gallery-13.jpg", alt: "Family pooja with priest", category: "Home Services" },
  { src: "/gallery/gallery-14.jpg", alt: "Hanuman deity with abhishekam", category: "Darshan" },
  { src: "/gallery/gallery-15.jpg", alt: "Gau Pooja - cow worship ceremony", category: "Ceremonies" },
  { src: "/gallery/gallery-16.jpg", alt: "Shiva Lingam with floral decoration", category: "Darshan" },
  { src: "/gallery/gallery-17.jpg", alt: "Beautiful flower rangoli pooja setup", category: "Ceremonies" },
  { src: "/gallery/gallery-18.jpg", alt: "Shiva Lingam with flowers and coconuts", category: "Ceremonies" },
  { src: "/gallery/gallery-19.jpg", alt: "Shiva Parvati deity with floral offerings", category: "Darshan" },
  { src: "/gallery/gallery-20.jpg", alt: "Pandit Aditya Sharma with Shiva yantra", category: "Priests" },
  { src: "/gallery/gallery-21.jpg", alt: "Beautiful Navagraha rangoli with fruits", category: "Ceremonies" },
  { src: "/gallery/gallery-22.jpg", alt: "Pandit speaking at temple event", category: "Community" },
  { src: "/gallery/gallery-23.jpg", alt: "Ram Parivar celebration with mandapam", category: "Festivals" },
  { src: "/gallery/gallery-24.jpg", alt: "Deity adorned with roses and jewels", category: "Darshan" },
  { src: "/gallery/gallery-25.jpg", alt: "Ram Parivar event - priest addressing devotees", category: "Festivals" },
];

const categories = ["All", ...Array.from(new Set(galleryImages.map((img) => img.category)))];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // True until the current full-size lightbox image finishes loading, so a
  // spinner can be shown instead of a blank box on slow networks (RN-162).
  const [lightboxImgLoading, setLightboxImgLoading] = useState(false);

  const filtered =
    selectedCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  // Focus management for the modal lightbox (WCAG 2.4.3 / 2.1.2): focus moves
  // into the dialog on open, Tab is trapped among its controls, and focus
  // returns to the triggering thumbnail on close.
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // Background content (header + filters + grid) is made inert while the
  // lightbox is open so screen-reader virtual-cursor navigation can't escape
  // the modal (RN-073 / WCAG 2.4.3 / 4.1.2).
  const backgroundRef = useRef<HTMLDivElement>(null);
  // Grid buttons keyed by image src so focus can be restored to the photo
  // currently being viewed, not just the originally-clicked one (RN-160).
  const gridButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openLightbox = (filteredIndex: number) => {
    triggerRef.current = (document.activeElement as HTMLElement) ?? null;
    setLightboxIndex(filteredIndex);
  };

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : prev === 0 ? filtered.length - 1 : prev - 1));
  }, [filtered.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : prev === filtered.length - 1 ? 0 : prev + 1));
  }, [filtered.length]);

  // Phones: swipe left/right in the lightbox to change photos.
  const touchStartX = useRef<number | null>(null);
  const onLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onLightboxTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  // Close lightbox if index is out of bounds (e.g. filter changed)
  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= filtered.length) {
      closeLightbox();
    }
  }, [lightboxIndex, filtered.length, closeLightbox]);

  // Show the spinner whenever the viewed image changes (open + Prev/Next); the
  // image's onLoad/onError clears it (RN-162).
  useEffect(() => {
    if (lightboxIndex !== null) setLightboxImgLoading(true);
  }, [lightboxIndex]);

  // Keyboard navigation + body scroll lock for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handleKey);
    // Android back button closes the lightbox instead of leaving the gallery.
    const unregister = pushOverlay(closeLightbox);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
      unregister();
    };
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  // Keyed on open/close (not the index) so navigating Prev/Next doesn't steal
  // focus back to the trigger mid-viewing.
  const lightboxOpen = lightboxIndex !== null;
  // Tracks the src currently being viewed so close-focus lands on the matching
  // grid thumbnail even after Prev/Next navigation (RN-160). Kept in a ref so
  // the open-keyed cleanup below reads the latest value without re-running.
  const currentSrcRef = useRef<string | null>(null);
  currentSrcRef.current =
    lightboxIndex !== null && lightboxIndex < filtered.length
      ? filtered[lightboxIndex].src
      : null;

  useEffect(() => {
    if (!lightboxOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Take the background out of the accessibility tree + tab order so AT
    // virtual-cursor/rotor navigation stays inside the modal (RN-073).
    const background = backgroundRef.current;
    if (background) {
      background.setAttribute("inert", "");
      background.setAttribute("aria-hidden", "true");
    }
    const focusables = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
    focusables()[0]?.focus(); // move focus into the dialog
    const trapTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trapTab);
    return () => {
      dialog.removeEventListener("keydown", trapTab);
      if (background) {
        background.removeAttribute("inert");
        background.removeAttribute("aria-hidden");
      }
      // Restore focus to the thumbnail matching the photo last viewed, falling
      // back to the original trigger if that button no longer exists (RN-160).
      // We intentionally read the live ref map at cleanup time so it reflects
      // the image the user navigated to, not the one captured at open.
      const src = currentSrcRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const target = (src && gridButtonRefs.current[src]) || triggerRef.current;
      target?.focus();
    };
  }, [lightboxOpen]);

  return (
    <div>
      {/* Header + filters + grid: made inert while the lightbox is open (RN-073). */}
      <div ref={backgroundRef}>
      {/* Burgundy + gold themed header to match the rest of the site */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #4A0818 0%, #5E0A1F 50%, #4A0818 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.08] bg-gold-shimmer" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-temple-gold/15 border border-temple-gold/30">
            <Camera className="h-7 w-7 text-temple-gold-light" />
          </div>
          <p className="font-accent text-sm font-semibold tracking-[0.2em] uppercase text-temple-gold-light">
            RNHT
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-white sm:text-5xl tracking-tight">
            Gallery
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-temple-gold/60" />
            <span className="text-temple-gold text-sm">&#x2733;</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-temple-gold/60" />
          </div>
          <p className="mt-4 mx-auto max-w-2xl text-gray-300 font-accent text-lg">
            Glimpses of divine moments from our temple ceremonies, festivals, and community events.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Category Filter */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            aria-pressed={selectedCategory === cat}
            className={`min-h-[44px] rounded-full px-5 text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-temple-red text-white ring-2 ring-temple-red ring-offset-2"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="mt-8 columns-2 gap-2 sm:gap-4 sm:columns-3 lg:columns-4">
        {filtered.map((img, i) => (
          <button
            key={img.src}
            type="button"
            ref={(el) => {
              gridButtonRefs.current[img.src] = el;
            }}
            className="mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-xl group bg-transparent border-0 p-0 text-left w-full"
            aria-label={`View ${img.alt}`}
            onClick={() => openLightbox(i)}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={400}
              height={300}
              className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* See All Images — opens the temple's full Google Photos album (client-provided). */}
      <div className="mt-10 flex justify-center">
        <a
          href="https://photos.google.com/share/AF1QipNp1Bx2WgxAWNsXPJxlCGouTnlr5LloSH_I4n34AwnhZXVMy5_1joSLpx5jAb4EeA?pli=1&key=OVBWdGJPdnBSaWd5MVVlbUVKdF82WnRMZF8yTklB"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-temple-red px-8 py-3 text-sm font-semibold text-white shadow-premium transition-colors hover:bg-temple-maroon"
        >
          <Camera className="h-4 w-4" />
          See All Images
        </a>
      </div>
      </div>
      </div>

      {/* Lightbox — rendered as a sibling of the inert background so AT focus
          stays inside the modal (RN-073). */}
      {lightboxIndex !== null && lightboxIndex < filtered.length && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`Image: ${filtered[lightboxIndex].alt}`}
          onClick={closeLightbox}
          onTouchStart={onLightboxTouchStart}
          onTouchEnd={onLightboxTouchEnd}
        >
          <button
            className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-lg p-2 text-white hover:bg-white/10 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white hover:bg-white/10 z-10"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white hover:bg-white/10 z-10"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div
            className="relative flex max-h-[85vh] max-w-[90vw] flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxImgLoading && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                role="status"
                aria-live="polite"
              >
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="sr-only">Loading image…</span>
              </div>
            )}
            <Image
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              width={1200}
              height={900}
              priority
              onLoad={() => setLightboxImgLoading(false)}
              onError={() => setLightboxImgLoading(false)}
              className="min-h-0 w-auto flex-1 rounded-lg object-contain"
            />
            <p className="mt-3 shrink-0 text-center text-sm text-gray-300">
              {filtered[lightboxIndex].alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
