import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Temple member dashboard for bookings, donations, and profile details.",
  alternates: {
    canonical: canonicalPath("/dashboard"),
  },
  openGraph: {
    title: "Dashboard",
    description: "Temple member dashboard for bookings, donations, and profile details.",
    url: canonicalPath("/dashboard"),
    images: [],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
