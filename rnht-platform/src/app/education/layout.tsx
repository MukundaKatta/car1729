import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Education & Classes",
  description: "Vedic chanting, Sanskrit, Telugu, yoga, and children's programs at Rudra Narayana Hindu Temple.",
  alternates: {
    canonical: canonicalPath("/education"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
