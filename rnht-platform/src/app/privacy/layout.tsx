import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Rudra Narayana Hindu Temple collects, uses, and protects your personal information.",
  alternates: { canonical: canonicalPath("/privacy") },
  openGraph: {
    title: "Privacy Policy | Rudra Narayana Hindu Temple",
    description: "How Rudra Narayana Hindu Temple collects, uses, and protects your personal information.",
    url: canonicalPath("/privacy"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Privacy Policy | Rudra Narayana Hindu Temple",
    description: "How Rudra Narayana Hindu Temple collects, uses, and protects your personal information.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
