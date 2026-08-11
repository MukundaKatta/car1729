"use client";

import { useState } from "react";
import { MessageCircle, Phone, ClipboardList } from "lucide-react";
import type { Service } from "@/types/database";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { ServiceCarousel } from "./ServiceCarousel";
import { usePanditjiWhatsApp } from "@/store/panditji";
import { safeHref } from "@/lib/url";
import { getRegistrationUrl } from "@/lib/service-registration";
import { serviceGallery, serviceCategoryFallback } from "@/lib/service-images";

const categoryIcons: Record<string, string> = {
  "cat-1": "🙏", // Puja & Shanti
  "cat-2": "📿", // Parayanam & Devotion
  "cat-3": "🪔", // Shraddham & Ancestor Rites
  "cat-4": "🪷", // Kalyanam & Weddings
  "cat-5": "🔥", // Rudrabhishekam & Abhishekam
};

// Torana (canopy) arch that separates the image from the content — traced pixel
// -for-pixel from the client's Vector.png so it matches their reference exactly.
// CREAM fills the panel below the arch (masks the image bottom); STROKE is the
// gold outline of the arch curve. viewBox is 1000×240, stretched to card width.
const ARCH_CREAM =
  "M0,201 L8.9,201 L22.3,173 L36.8,159 L51.3,152 L65.8,147 L79.2,143 L93.8,137 L108.3,124 L122.8,71 L136.2,49 L150.7,35 L165.2,26 L179.7,19 L193.1,14 L207.6,9 L222.1,6 L236.6,4 L250.0,2 L264.5,1 L279.0,0 L293.5,0 L306.9,0 L321.4,0 L335.9,1 L350.4,2 L363.8,3 L378.3,3 L392.9,4 L407.4,4 L420.8,4 L435.3,4 L449.8,4 L464.3,3 L477.7,3 L492.2,2 L506.7,2 L521.2,3 L534.6,3 L549.1,4 L563.6,4 L578.1,4 L591.5,4 L606.0,4 L620.5,3 L635.0,3 L648.4,2 L662.9,1 L677.5,0 L692.0,0 L705.4,0 L719.9,0 L734.4,1 L748.9,2 L762.3,3 L776.8,6 L791.3,9 L805.8,13 L819.2,18 L833.7,25 L848.2,34 L862.7,48 L876.1,68 L890.6,122 L905.1,137 L919.6,143 L933.0,147 L947.5,151 L962.1,158 L976.6,171 L991.1,200 L1000,200 L1000,240 L0,240 Z";
const ARCH_STROKE =
  "M0,201 L8.9,201 L22.3,173 L36.8,159 L51.3,152 L65.8,147 L79.2,143 L93.8,137 L108.3,124 L122.8,71 L136.2,49 L150.7,35 L165.2,26 L179.7,19 L193.1,14 L207.6,9 L222.1,6 L236.6,4 L250.0,2 L264.5,1 L279.0,0 L293.5,0 L306.9,0 L321.4,0 L335.9,1 L350.4,2 L363.8,3 L378.3,3 L392.9,4 L407.4,4 L420.8,4 L435.3,4 L449.8,4 L464.3,3 L477.7,3 L492.2,2 L506.7,2 L521.2,3 L534.6,3 L549.1,4 L563.6,4 L578.1,4 L591.5,4 L606.0,4 L620.5,3 L635.0,3 L648.4,2 L662.9,1 L677.5,0 L692.0,0 L705.4,0 L719.9,0 L734.4,1 L748.9,2 L762.3,3 L776.8,6 L791.3,9 L805.8,13 L819.2,18 L833.7,25 L848.2,34 L862.7,48 L876.1,68 L890.6,122 L905.1,137 L919.6,143 L933.0,147 L947.5,151 L962.1,158 L976.6,171 L991.1,200 L1000,200";

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
  // panditjiWhatsApp is admin-controlled (panditji_routing). Validate its scheme
  // before it becomes an href so a stored `javascript:`/`data:` value can't
  // execute in a visitor's browser (stored XSS). safeHref returns undefined for
  // a disallowed scheme -> render no WhatsApp link.
  const safeWhatsappBase = safeHref(panditjiWhatsApp);
  const whatsappHref = safeWhatsappBase
    ? buildWhatsAppHref(safeWhatsappBase, whatsappMessage)
    : undefined;
  const registerUrl = getRegistrationUrl(service.slug);

  // Client-provided gallery (0..10 images). Fall back to the single DB
  // image_url, then to a category-appropriate photo reused from another service
  // of the same type (homam→homam, kalyanam→kalyanam, etc.), then finally to the
  // category-icon placeholder (ServiceCarousel renders that when the list is empty).
  const gallery = serviceGallery(service.slug);
  const images = gallery.length
    ? gallery
    : service.image_url
      ? [service.image_url]
      : serviceCategoryFallback(service.slug);

  // Split a trailing "(...)" into a smaller subtitle, matching the reference
  // (e.g. "SRI SEETA RAMA KALYANAM (CELESTIAL WEDDING CEREMONY OF SEETA RAMA)").
  const nameMatch = service.name.match(/^(.*?)\s*(\(.*\))\s*$/);
  const titleMain = nameMatch ? nameMatch[1].trim() : service.name;
  const titleSub = nameMatch ? nameMatch[2].trim() : null;

  const flourish = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/decor/flourish.png`;

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-[26px] border border-temple-gold/45 bg-[#fdf8ee] shadow-sm transition-shadow hover:shadow-md">
        {/* Image + torana arch. The arch (cream) overlays the image bottom so
            the white content appears to arch up into the photo. Clicking the
            image opens the modal; carousel arrows stopPropagation. */}
        <div className="relative">
          <ServiceCarousel
            images={images}
            alt={service.name}
            variant="card"
            fallbackIcon={icon}
            onImageClick={() => setShowModal(true)}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-[-1px]"
            style={{ aspectRatio: "1000 / 240" }}
          >
            <svg
              viewBox="0 0 1000 240"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <path d={ARCH_CREAM} fill="#fdf8ee" />
              <path
                d={ARCH_STROKE}
                fill="none"
                stroke="#C99A3A"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col px-5 pb-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flourish}
            alt=""
            aria-hidden="true"
            className="mx-auto mt-1 h-3.5 w-auto max-w-[65%] object-contain"
          />
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-2 block w-full cursor-pointer text-center"
            aria-label={`View details for ${service.name}`}
          >
            <h3 className="font-heading text-lg font-bold leading-snug text-temple-maroon">
              {titleMain}
            </h3>
            {titleSub && (
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-temple-maroon/70">
                {titleSub}
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-3">
              {service.short_description}
            </p>
          </button>

          <div className="mt-auto space-y-2 pt-4">
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
              {whatsappHref && (
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
              )}
              <a
                href="tel:+15125450473"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-temple-gold/40 bg-white px-3 py-2 text-sm font-semibold text-temple-maroon transition-colors hover:bg-temple-gold/10"
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
