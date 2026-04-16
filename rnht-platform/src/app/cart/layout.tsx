import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review selected temple services before continuing to checkout.",
  alternates: {
    canonical: canonicalPath("/cart"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
