import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Financial Transparency",
  description:
    "RNHT is a registered 501(c)(3) nonprofit. Annual financial statements and donor recognition information available on request.",
  alternates: {
    canonical: canonicalPath("/transparency"),
  },
};

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-temple-gold/25 bg-temple-gold/10">
          <ShieldCheck className="h-7 w-7 text-temple-red" />
        </div>
        <h1 className="mt-4 section-heading">Financial Transparency</h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Rudra Narayana Hindu Temple is committed to financial transparency
          with our devotees and community.
        </p>
      </div>

      <section className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-4">
          <FileText className="h-8 w-8 flex-shrink-0 text-green-700" />
          <div>
            <h2 className="font-heading text-lg font-bold text-green-900">
              501(c)(3) tax-exempt nonprofit
            </h2>
            <p className="mt-2 text-sm text-green-800">
              RNHT is a registered 501(c)(3) tax-exempt nonprofit organization.
              All donations are tax-deductible to the full extent of the law.
              Tax receipts are issued for donations.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-green-700">
              <li>&middot; EIN available upon request</li>
              <li>&middot; Annual Form 990 filed with the IRS</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-temple-gold/15 bg-white p-6 shadow-premium">
        <h2 className="font-heading text-lg font-bold text-temple-maroon">
          Annual financial statements
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Annual financial statements and Form 990 filings are available on
          request to any devotee or supporter. Reach out and we&rsquo;ll send
          you the most recent fiscal year report.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-temple-gold/40 px-4 py-2 text-sm font-semibold text-temple-maroon transition-colors hover:bg-temple-gold/10"
        >
          <Download className="h-4 w-4" />
          Request financial report
        </Link>
      </section>

      <section className="mt-8 rounded-2xl border border-temple-gold/15 bg-temple-ivory/40 p-6">
        <h2 className="font-heading text-lg font-bold text-temple-maroon">
          Donor recognition
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          We are grateful to every devotee who supports the temple. Donors are
          recognized only with explicit opt-in. If you would like your
          contribution acknowledged publicly (or kept anonymous), let us know
          when you donate or update your preference any time.
        </p>
      </section>
    </div>
  );
}
