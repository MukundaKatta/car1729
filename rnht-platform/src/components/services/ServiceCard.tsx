"use client";

import { useState } from "react";
import { MessageCircle, Phone, ClipboardList } from "lucide-react";
import type { Service } from "@/types/database";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { ServiceCarousel } from "./ServiceCarousel";
import { usePanditjiWhatsApp } from "@/store/panditji";
import { getRegistrationUrl } from "@/lib/service-registration";
import { serviceGallery } from "@/lib/service-images";

const categoryIcons: Record<string, string> = {
  "cat-1": "🙏", // Puja & Shanti
  "cat-2": "📿", // Parayanam & Devotion
  "cat-3": "🪔", // Shraddham & Ancestor Rites
  "cat-4": "🪷", // Kalyanam & Weddings
  "cat-5": "🔥", // Rudrabhishekam & Abhishekam
};

/**
 * Build a WhatsApp chat link with a prefilled `text` message.
 *
 * The wa.me/message/<code> invite short-links (used elsewhere in the app)
 * do NOT honor a `?text=` query, so appending it silently drops the message.
 * For those we return the base URL unchanged rather than producing a broken
 * link. For supported URLs we use `&` when a query string already exists so
 * we never emit a malformed second `?`.
 */
function buildWhatsAppHref(baseUrl: string, encodedMessage: string): string {
  const url = baseUrl.trim();
  // Invite short-links don't support prefilled text — leave them untouched.
  if (/wa\.me\/message\//i.test(url)) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}text=${encodedMessage}`;
}

export function ServiceCard({ service }: { service: Service }) {
  const [showModal, setShowModal] = useState(false);
  const panditjiWhatsApp = usePanditjiWhatsApp();
  const icon = categoryIcons[service.category_id] || "🙏";

  const whatsappMessage = encodeURIComponent(
    `Namaste! I would like to enquire about ${service.name}. Please share the details and availability.`
  );
  const whatsappHref = buildWhatsAppHref(panditjiWhatsApp, whatsappMessage);
  const registerUrl = getRegistrationUrl(service.slug);

  // Client-provided gallery for this service (0..10 images). Fall back to the
  // single DB image_url, then to the category-icon placeholder (ServiceCarousel
  // renders the placeholder itself when the list is empty).
  const gallery = serviceGallery(service.slug);
  const images = gallery.length
    ? gallery
    : service.image_url
      ? [service.image_url]
      : [];

  return (
    <>
      <div className="card overflow-hidden group">
        {/* Image gallery (swipeable slideshow when the service has multiple
            photos). Clicking the image opens the modal; the carousel's own
            arrows/dots stopPropagation, so they never open it. The title/text
            below is a separate <button> — interactive controls stay siblings,
            never nested (valid ARIA). */}
        <ServiceCarousel
          images={images}
          alt={service.name}
          variant="card"
          fallbackIcon={icon}
          onImageClick={() => setShowModal(true)}
        />
        <div className="ornament-divider mt-4 px-4" aria-hidden="true">
          <span>&#x2733;</span>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="block w-full cursor-pointer px-5 pt-2 text-center"
          aria-label={`View details for ${service.name}`}
        >
          <h3 className="font-heading text-base font-bold leading-tight text-temple-maroon">
            {service.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600 line-clamp-3">
            {service.short_description}
          </p>
        </button>
        <div className="px-4 pb-4">
          <div className="mt-4 space-y-2">
            {registerUrl && (
              <a
                href={registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-temple-red px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-temple-red-dark"
                aria-label={`Register for ${service.name}`}
              >
                <ClipboardList className="h-4 w-4" />
                Register
              </a>
            )}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                aria-label={`Message about ${service.name} on WhatsApp`}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="tel:+15125450473"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-temple-gold/40 bg-temple-cream px-3 py-2 text-sm font-semibold text-temple-maroon transition-colors hover:bg-temple-gold/15"
                aria-label={`Call the temple about ${service.name}`}
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <ServiceDetailModal
          service={service}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
