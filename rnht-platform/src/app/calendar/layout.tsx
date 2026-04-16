import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Temple Calendar",
  description: "View upcoming festivals, poojas, community events, and classes at Rudra Narayana Hindu Temple.",
  alternates: {
    canonical: canonicalPath("/calendar"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
