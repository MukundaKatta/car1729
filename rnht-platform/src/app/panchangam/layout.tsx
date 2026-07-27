import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Daily Panchangam",
  description:
    "Daily Hindu Panchangam localized to your city. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, and auspicious timings.",
  openGraph: {
    title: "Daily Panchangam | Rudra Narayana Hindu Temple",
    description: "Daily Hindu Panchangam localized to your city. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, and auspicious timings.",
    url: canonicalPath("/panchangam"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Daily Panchangam | Rudra Narayana Hindu Temple",
    description: "Daily Hindu Panchangam localized to your city. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, and auspicious timings.",
  },
  alternates: {
    canonical: canonicalPath("/panchangam"),
  },
};

export default function PanchangamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
