import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "News & Updates",
  description: "Festivals, announcements, and community updates from Rudra Narayana Hindu Temple.",
  alternates: {
    canonical: canonicalPath("/news"),
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
