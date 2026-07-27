import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from temple ceremonies, festivals, community events, and darshan at Rudra Narayana Hindu Temple.",
  openGraph: {
    title: "Gallery | Rudra Narayana Hindu Temple",
    description: "Photos from temple ceremonies, festivals, community events, and darshan at Rudra Narayana Hindu Temple.",
    url: canonicalPath("/gallery"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Gallery | Rudra Narayana Hindu Temple",
    description: "Photos from temple ceremonies, festivals, community events, and darshan at Rudra Narayana Hindu Temple.",
  },
  alternates: {
    canonical: canonicalPath("/gallery"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
