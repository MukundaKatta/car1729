import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Pooja & Spiritual Services",
  description: "Book authentic Vedic poojas, homams, weddings, and spiritual services. Serving Austin, Kyle, Georgetown, Round Rock, and the greater Texas area.",
  openGraph: {
    title: "Pooja & Spiritual Services | Rudra Narayana Hindu Temple",
    description: "Book authentic Vedic poojas, homams, weddings, and spiritual services. Serving Austin, Kyle, Georgetown, Round Rock, and the greater Texas area.",
    url: canonicalPath("/services"),
    type: "website",
  },
  twitter: {
    title: "Pooja & Spiritual Services | Rudra Narayana Hindu Temple",
    description: "Book authentic Vedic poojas, homams, weddings, and spiritual services. Serving Austin, Kyle, Georgetown, Round Rock, and the greater Texas area.",
  },
  alternates: {
    canonical: canonicalPath("/services"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
