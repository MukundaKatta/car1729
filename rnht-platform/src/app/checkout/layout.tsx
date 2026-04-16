import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete temple service booking and payment securely online.",
  alternates: {
    canonical: canonicalPath("/checkout"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
