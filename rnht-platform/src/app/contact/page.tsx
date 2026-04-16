import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MessageCircle, Users } from "lucide-react";
import { NewsAndUpdates } from "@/components/home/NewsAndUpdates";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Rudra Narayana Hindu Temple priests. Pt. Aditya Sharma: (512) 545-0473 (WhatsApp). Pt. Raghurama Sharma: (512) 998-0112. Serving Austin, Kyle, Manor, Round Rock, TX.",
  alternates: {
    canonical: canonicalPath("/contact"),
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <Phone className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Contact Us</h1>
        <p className="mt-3 text-gray-600">
          Reach out to our priests for any service inquiries or spiritual guidance.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2">
        {/* Pt. Aditya Sharma */}
        <div className="card p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Pt. Aditya Sharma
          </h2>
          <p className="mt-1 text-sm text-temple-red font-semibold">
            Founder & Head Priest
          </p>
          <div className="mt-4 space-y-3">
            <a
              href="https://wa.me/message/P3YRA2XY3GI7F1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">(512) 545-0473</p>
                <p className="text-xs">WhatsApp</p>
              </div>
            </a>
          </div>
        </div>

        {/* Pt. Raghurama Sharma */}
        <div className="card p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Pt. Raghurama Sharma
          </h2>
          <p className="mt-1 text-sm text-temple-red font-semibold">
            Senior Priest
          </p>
          <div className="mt-4 space-y-3">
            <a
              href="tel:+15129980112"
              className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Phone className="h-5 w-5" />
              <div>
                <p className="font-semibold">(512) 998-0112</p>
                <p className="text-xs">Phone</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* WhatsApp Group & Service Form */}
      <div className="mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2">
        <a
          href="https://wa.me/message/P3YRA2XY3GI7F1"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-4 p-6 hover:border-green-400 transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Join Temple WhatsApp Group</p>
            <p className="text-sm text-gray-500">Stay updated with temple activities</p>
          </div>
        </a>

        <Link
          href="/services"
          className="card flex items-center gap-4 p-6 hover:border-temple-gold transition-colors"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-temple-cream">
            <Phone className="h-6 w-6 text-temple-red" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Book a Temple Service</p>
            <p className="text-sm text-gray-500">Browse and book poojas online</p>
          </div>
        </Link>
      </div>

      {/* Service Areas */}
      <div className="mt-10 card p-6">
        <h3 className="font-heading text-lg font-bold text-gray-900">
          Service Areas in Texas
        </h3>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Kyle, Manor, Austin, Dallas, Houston, Lakeway, Bee Cave, Georgetown,
          Round Rock, San Antonio, Leander, Dripping Springs, Lago Vista,
          Liberty Hill, Avery Ranch, Steiner Ranch
        </p>
      </div>

      {/* Zelle Donation */}
      <div className="mt-10 card p-6 bg-temple-cream/50">
        <h3 className="font-heading text-lg font-bold text-gray-900">
          Donate via Zelle
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Send donations directly via Zelle to:{" "}
          <strong className="text-temple-maroon">(512) 545-0473</strong>
        </p>
      </div>

      {/* Recent updates — pulled from the News CMS */}
      <div className="mt-12">
        <h3 className="font-heading text-lg font-bold text-gray-900">
          Recent Updates
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          The latest temple announcements and festivals.
        </p>
        <div className="mt-4">
          <NewsAndUpdates limit={3} compact />
        </div>
      </div>
    </div>
  );
}
