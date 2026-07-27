import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "News & Updates",
  description: "Festivals, announcements, and community updates from Rudra Narayana Hindu Temple.",
  openGraph: {
    title: "News & Updates | Rudra Narayana Hindu Temple",
    description: "Festivals, announcements, and community updates from Rudra Narayana Hindu Temple.",
    url: canonicalPath("/news"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "News & Updates | Rudra Narayana Hindu Temple",
    description: "Festivals, announcements, and community updates from Rudra Narayana Hindu Temple.",
  },
  alternates: {
    canonical: canonicalPath("/news"),
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
