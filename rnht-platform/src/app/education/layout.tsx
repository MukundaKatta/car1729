import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Education & Classes",
  description: "Vedic chanting, Sanskrit, Telugu, yoga, and children's programs at Rudra Narayana Hindu Temple.",
  openGraph: {
    title: "Education & Classes | Rudra Narayana Hindu Temple",
    description: "Vedic chanting, Sanskrit, Telugu, yoga, and children's programs at Rudra Narayana Hindu Temple.",
    url: canonicalPath("/education"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Education & Classes | Rudra Narayana Hindu Temple",
    description: "Vedic chanting, Sanskrit, Telugu, yoga, and children's programs at Rudra Narayana Hindu Temple.",
  },
  alternates: {
    canonical: canonicalPath("/education"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
