import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Live Darshan & Streaming",
  description: "Watch live aarti, festival celebrations, and special ceremonies streamed from Rudra Narayana Hindu Temple.",
  alternates: {
    canonical: canonicalPath("/streaming"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
