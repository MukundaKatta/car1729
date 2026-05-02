"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Service } from "@/types/database";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { usePanditjiWhatsApp } from "@/store/panditji";

const categoryIcons: Record<string, string> = {
  "cat-1": "🙏", // Puja & Shanti
  "cat-2": "📿", // Parayanam & Devotion
  "cat-3": "🪔", // Shraddham & Ancestor Rites
  "cat-4": "💒", // Kalyanam & Weddings
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
        <div className="h-36 bg-gradient-to-br from-temple-cream to-temple-gold/20 flex items-center justify-center">
          <span className="text-5xl opacity-60 transition-transform group-hover:scale-110">
            {icon}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-heading font-bold text-gray-900 leading-tight">
            {service.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {service.short_description}
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Contact Panditji about ${service.name} on WhatsApp`}
            >
              <MessageCircle className="h-4 w-4" />
              Contact Panditji
            </a>
            <button
              className="rounded-lg border border-temple-gold/40 px-3 py-2 text-sm font-semibold text-temple-maroon transition-colors hover:bg-temple-gold/10"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              Details
            </button>
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
