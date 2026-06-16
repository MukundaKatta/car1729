import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Rudra Narayana Hindu Temple.",
  alternates: { canonical: canonicalPath("/contact") },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
