import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Financial Transparency",
  description: "View annual financial statements, building fund progress, and donor recognition for Rudra Narayana Hindu Temple. 501(c)(3) nonprofit.",
  openGraph: {
    title: "Financial Transparency | Rudra Narayana Hindu Temple",
    description: "View annual financial statements, building fund progress, and donor recognition for Rudra Narayana Hindu Temple. 501(c)(3) nonprofit.",
    url: canonicalPath("/transparency"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Financial Transparency | Rudra Narayana Hindu Temple",
    description: "View annual financial statements, building fund progress, and donor recognition for Rudra Narayana Hindu Temple. 501(c)(3) nonprofit.",
  },
  alternates: {
    canonical: canonicalPath("/transparency"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
