import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Rudra Narayana Hindu Temple — our mission, priests, and authentic Vedic services for the Austin Hindu community.",
  alternates: { canonical: canonicalPath("/about") },
  openGraph: {
    title: "About Us | Rudra Narayana Hindu Temple",
    description: "Learn about Rudra Narayana Hindu Temple — our mission, priests, and authentic Vedic services for the Austin Hindu community.",
    url: canonicalPath("/about"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "About Us | Rudra Narayana Hindu Temple",
    description: "Learn about Rudra Narayana Hindu Temple — our mission, priests, and authentic Vedic services for the Austin Hindu community.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
