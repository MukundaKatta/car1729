"use client";

import { useState } from "react";
import { MessageCircle, Phone, ClipboardList } from "lucide-react";
import type { Service } from "@/types/database";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { usePanditjiWhatsApp } from "@/store/panditji";
import { getRegistrationUrl } from "@/lib/service-registration";

const categoryIcons: Record<string, string> = {
  "cat-1": "🙏", // Puja & Shanti
  "cat-2": "📿", // Parayanam & Devotion
  "cat-3": "🪔", // Shraddham & Ancestor Rites
  "cat-4": "🪷", // Kalyanam & Weddings
  "cat-5": "🔥", // Rudrabhishekam & Abhishekam
};

export function ServiceCard({ service }: { service: Service }) {
  const [showModal, setShowModal] = useState(false);
  const panditjiWhatsApp = usePanditjiWhatsApp();
  const icon = categoryIcons[service.category_id] || "🙏";

  const whatsappMessage = encodeURIComponent(
    `Namaste! I would like to enquire about ${service.name}. Please share the details and availability.`
  );
  const whatsappHref = `${panditjiWhatsApp}?text=${whatsappMessage}`;
  const registerUrl = getRegistrationUrl(service.slug);

  return (
    <>
      <div
        className="card cursor-pointer overflow-hidden group"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowModal(true);
          }
        }}
        aria-label={service.name}
      >
        {service.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={service.image_url}
            alt={service.name}
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-gradient-to-br from-temple-cream to-temple-gold/20">
            <span className="text-5xl opacity-60 transition-transform group-hover:scale-110">
              {icon}
            </span>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-heading font-bold text-gray-900 leading-tight">
            {service.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {service.short_description}
          </p>
          <div className="mt-4 space-y-2">
            {registerUrl && (
              <a
                href={registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-temple-red px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-temple-red-dark"
                onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
                aria-label={`Message about ${service.name} on WhatsApp`}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="tel:+15125450473"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-temple-gold/40 bg-temple-cream px-3 py-2 text-sm font-semibold text-temple-maroon transition-colors hover:bg-temple-gold/15"
                onClick={(e) => e.stopPropagation()}
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
