import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Pooja & Spiritual Services",
  description: "Book authentic Vedic poojas, homams, weddings, and spiritual services. Serving Austin, Kyle, Round Rock, and the greater Texas area.",
  openGraph: {
    title: "Pooja & Spiritual Services | Rudra Narayana Hindu Temple",
    description: "Book authentic Vedic poojas, homams, weddings, and spiritual services. Serving Austin, Kyle, Round Rock, and the greater Texas area.",
    url: canonicalPath("/services"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pooja & Spiritual Services | Rudra Narayana Hindu Temple",
    description: "Book authentic Vedic poojas, homams, weddings, and spiritual services. Serving Austin, Kyle, Round Rock, and the greater Texas area.",
    images: ["/deity-collage.jpg"],
  },
  alternates: {
    canonical: canonicalPath("/services"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
