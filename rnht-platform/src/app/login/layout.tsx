import type { Metadata } from "next";
import { canonicalPath } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage temple bookings, donations, and family details.",
  alternates: {
    canonical: canonicalPath("/login"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
