import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  // Keep the 404 out of search indexes (it would otherwise inherit the root
  // layout's index:true) — error pages should never appear in results.
  robots: { index: false, follow: false },
};

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl">🙏</div>
      <h1 className="mt-6 font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-gray-600">
        The page you are looking for does not exist. It may have been moved or
        the URL might be incorrect.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-primary">
          Go Home
        </Link>
        <Link href="/services" className="btn-secondary">
          View Services
        </Link>
        <Link href="/calendar" className="btn-outline">
          Events Calendar
        </Link>
      </div>
    </div>
  );
}
