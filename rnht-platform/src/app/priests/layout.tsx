import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Our Priests",
  description: "Meet RNHT's experienced Vedic priests offering poojas, homams, weddings, and ceremonies across Austin and greater Texas.",
  alternates: { canonical: canonicalPath("/priests") },
  openGraph: {
    title: "Our Priests | Rudra Narayana Hindu Temple",
    description: "Meet RNHT's experienced Vedic priests offering poojas, homams, weddings, and ceremonies across Austin and greater Texas.",
    url: canonicalPath("/priests"),
    type: "website",
  },
  twitter: {
    title: "Our Priests | Rudra Narayana Hindu Temple",
    description: "Meet RNHT's experienced Vedic priests offering poojas, homams, weddings, and ceremonies across Austin and greater Texas.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
