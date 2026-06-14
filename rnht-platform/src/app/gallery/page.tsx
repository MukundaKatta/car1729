"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Camera, X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
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

const DRIVE_LINK = "https://photos.app.goo.gl/rnht";

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    selectedCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  const openLightbox = (filteredIndex: number) => {
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

  return (
    <div>
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
            className={`min-h-[44px] rounded-full px-5 text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-temple-red text-white"
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

      {/* View Full Gallery CTA */}
      <div className="mt-12 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-temple-cream to-temple-gold/10 p-5 sm:p-8">
          <Camera className="mx-auto h-8 w-8 text-temple-gold" />
          <h2 className="mt-4 font-heading text-xl font-bold text-gray-900">
            Want to see more?
          </h2>
          <p className="mt-2 text-gray-600">
            Browse our complete collection of photos and videos from all temple events.
          </p>
          <a
            href={DRIVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Full Gallery on Google Drive
          </a>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxIndex < filtered.length && (
        <div
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
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].alt}
              width={1200}
              height={900}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            <p className="mt-3 text-center text-sm text-gray-300">
              {filtered[lightboxIndex].alt}
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
