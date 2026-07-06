"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// The public Events Calendar was retired per the temple's direction — events
// stay manageable in the admin panel but are no longer shown on the frontend.
// This lightweight client redirect keeps old bookmarks / cached links from
// hitting a dead page in the static export (server redirects aren't available).
export default function CalendarRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold text-temple-maroon">
        Redirecting&hellip;
      </h1>
      <p className="mt-3 text-gray-600">Taking you to the homepage.</p>
      <Link href="/" className="btn-primary mt-6">
        Go to home
      </Link>
    </div>
  );
}
