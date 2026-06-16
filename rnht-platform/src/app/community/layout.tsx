import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Community Hub",
  description: "Volunteer, participate in Annadanam, and stay connected with Rudra Narayana Hindu Temple community events and announcements.",
  openGraph: {
    title: "Community Hub | Rudra Narayana Hindu Temple",
    description: "Volunteer, participate in Annadanam, and stay connected with Rudra Narayana Hindu Temple community events and announcements.",
    url: canonicalPath("/community"),
    type: "website",
  },
  twitter: {
    title: "Community Hub | Rudra Narayana Hindu Temple",
    description: "Volunteer, participate in Annadanam, and stay connected with Rudra Narayana Hindu Temple community events and announcements.",
  },
  alternates: {
    canonical: canonicalPath("/community"),
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
