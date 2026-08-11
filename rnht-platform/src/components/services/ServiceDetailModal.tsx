"use client";

import { useEffect, useRef } from "react";
import { X, MessageCircle, Phone } from "lucide-react";
import type { Service } from "@/types/database";
import { usePanditjiWhatsApp } from "@/store/panditji";
import { safeHref } from "@/lib/url";
import { pushOverlay } from "@/lib/overlay-stack";
import { ServiceCarousel } from "./ServiceCarousel";
import { serviceGallery } from "@/lib/service-images";

/**
 * Simplified service detail modal.
 *
 * Per requirements: no pricing, no duration, no location, no "what's
 * included", no "items to bring", and no inline booking form. The modal
 * is now an information view that routes all booking conversations
 * through WhatsApp → Panditji.
 */
export function ServiceDetailModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const whatsappUrl = usePanditjiWhatsApp();
  const dialogRef = useRef<HTMLDivElement>(null);
  const galleryImages = serviceGallery(service.slug);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Focus management: remember what was focused, move focus into the dialog,
    // trap Tab within it, and restore focus to the trigger on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
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
      }
    };
    document.addEventListener("keydown", handleKey);
    // Android back button closes the modal (this component only mounts when open).
    const unregister = pushOverlay(onClose);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
      unregister();
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const whatsappMessage = encodeURIComponent(
    `Namaste! I would like to enquire about ${service.name}. Please share the details and availability.`
  );
  // whatsappUrl is admin-controlled (panditji_routing). Validate its scheme
  // before it becomes an href so a stored `javascript:`/`data:` value can't
  // execute in a visitor's browser (stored XSS). safeHref returns undefined for
  // a disallowed scheme -> render no link.
  const safeWhatsappBase = safeHref(whatsappUrl);
  const whatsappHref = safeWhatsappBase
    ? `${safeWhatsappBase}?text=${whatsappMessage}`
    : undefined;
  const categoryIcon =
    service.category_id === "cat-1"
      ? "🙏"
      : service.category_id === "cat-2"
        ? "📿"
        : service.category_id === "cat-3"
          ? "🪔"
          : service.category_id === "cat-4"
            ? "🪷"
            : "🔥";

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/80 text-gray-500 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header gallery — full swipeable slideshow of the service's photos. */}
        <ServiceCarousel
          images={
            galleryImages.length
              ? galleryImages
              : service.image_url
                ? [service.image_url]
                : []
          }
          alt={service.name}
          variant="modal"
          fallbackIcon={categoryIcon}
        />

        <div className="p-6">
          <h2 id="modal-title" className="font-heading text-2xl font-bold text-temple-maroon">
            {service.name}
          </h2>

          <p className="mt-4 leading-relaxed text-gray-700">
            {service.full_description || service.short_description}
          </p>

          {service.significance && (
            <div className="mt-5 rounded-lg bg-temple-cream p-4">
              <h4 className="text-sm font-semibold text-temple-maroon">
                Spiritual Significance
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {service.significance}
              </p>
            </div>
          )}

          {/* Contact Panditji CTA */}
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-semibold text-gray-900">
              Contact Panditji for details
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Availability, items needed, and offering are arranged directly
              with the head priest.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Panditji
                </a>
              )}
              <a
                href="tel:+15125450473"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Phone className="h-4 w-4" />
                Call (512) 545-0473
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
