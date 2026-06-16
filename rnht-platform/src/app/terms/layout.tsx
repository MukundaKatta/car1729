import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of Use governing the Rudra Narayana Hindu Temple website, devotee accounts, donations, and bookings.",
  alternates: { canonical: canonicalPath("/terms") },
  openGraph: {
    title: "Terms of Use | Rudra Narayana Hindu Temple",
    description: "Terms of Use governing the Rudra Narayana Hindu Temple website, devotee accounts, donations, and bookings.",
    url: canonicalPath("/terms"),
    type: "website",
  },
  twitter: {
    title: "Terms of Use | Rudra Narayana Hindu Temple",
    description: "Terms of Use governing the Rudra Narayana Hindu Temple website, devotee accounts, donations, and bookings.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
