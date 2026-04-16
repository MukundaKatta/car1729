import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage member profile details, family information, and temple activity history.",
  alternates: {
    canonical: canonicalPath("/profile"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
