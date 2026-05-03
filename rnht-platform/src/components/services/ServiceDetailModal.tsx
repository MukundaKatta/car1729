"use client";

import { useEffect } from "react";
import { X, MessageCircle, Phone } from "lucide-react";
import type { Service } from "@/types/database";
import { usePanditjiWhatsApp } from "@/store/panditji";

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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const whatsappMessage = encodeURIComponent(
    `Namaste! I would like to enquire about ${service.name}. Please share the details and availability.`
  );
  const whatsappHref = `${whatsappUrl}?text=${whatsappMessage}`;
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
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        {service.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={service.image_url}
            alt={service.name}
            className="h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-temple-cream to-temple-gold/30">
            <span className="text-6xl opacity-60">{categoryIcon}</span>
          </div>
        )}

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
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Panditji
              </a>
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
