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
  },
  twitter: {
    title: "Privacy Policy | Rudra Narayana Hindu Temple",
    description: "How Rudra Narayana Hindu Temple collects, uses, and protects your personal information.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
