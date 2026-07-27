import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Live Darshan & Streaming",
  description: "Watch live aarti, festival celebrations, and special ceremonies streamed from Rudra Narayana Hindu Temple.",
  openGraph: {
    title: "Live Darshan & Streaming | Rudra Narayana Hindu Temple",
    description: "Watch live aarti, festival celebrations, and special ceremonies streamed from Rudra Narayana Hindu Temple.",
    url: canonicalPath("/streaming"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Live Darshan & Streaming | Rudra Narayana Hindu Temple",
    description: "Watch live aarti, festival celebrations, and special ceremonies streamed from Rudra Narayana Hindu Temple.",
  },
  alternates: {
    canonical: canonicalPath("/streaming"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
