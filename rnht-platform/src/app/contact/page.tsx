"use client";

import { useEffect } from "react";
import Link from "next/link";

// The standalone Contact page was retired — contact now happens via WhatsApp
// (and the details moved into the footer/about). This lightweight redirect keeps
// old bookmarks and cached search results from hitting a 404 in the static
// export, where server-side redirects aren't available.
const CONTACT_URL = "https://wa.me/message/P3YRA2XY3GI7F1";

export default function ContactRedirect() {
  useEffect(() => {
    window.location.replace(CONTACT_URL);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold text-temple-maroon">
        Contact the Temple
      </h1>
      <p className="mt-3 text-gray-600">
        Taking you to WhatsApp to reach us. If it doesn&apos;t open automatically,
        tap the button below.
      </p>
      <a
        href={CONTACT_URL}
        className="btn-primary mt-6"
        rel="noopener noreferrer"
      >
        Message us on WhatsApp
      </a>
      <Link href="/" className="mt-4 text-sm text-temple-maroon underline">
        Return to home
      </Link>
    </div>
  );
}
