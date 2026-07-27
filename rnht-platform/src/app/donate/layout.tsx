import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support Rudra Narayana Hindu Temple with tax-deductible donations. Choose from General, Building, Priest, Annadanam, Festival, or Education funds.",
  openGraph: {
    title: "Donate | Rudra Narayana Hindu Temple",
    description: "Support Rudra Narayana Hindu Temple with tax-deductible donations. Choose from General, Building, Priest, Annadanam, Festival, or Education funds.",
    url: canonicalPath("/donate"),
    type: "website",
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    title: "Donate | Rudra Narayana Hindu Temple",
    description: "Support Rudra Narayana Hindu Temple with tax-deductible donations. Choose from General, Building, Priest, Annadanam, Festival, or Education funds.",
  },
  alternates: {
    canonical: canonicalPath("/donate"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
