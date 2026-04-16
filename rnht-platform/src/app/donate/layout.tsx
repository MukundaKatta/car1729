import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support Rudra Narayana Hindu Temple with tax-deductible donations. Choose from General, Building, Priest, Annadanam, Festival, or Education funds.",
  alternates: {
    canonical: canonicalPath("/donate"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
