import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Sponsorship & Packages",
  description: "Sponsor temple festivals, deity ornaments, and save with bundled service packages. All sponsorships are tax-deductible.",
  alternates: {
    canonical: canonicalPath("/sponsorship"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
