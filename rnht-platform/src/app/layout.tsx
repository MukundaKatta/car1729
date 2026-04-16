import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FallingPetals } from "@/components/effects/FallingPetals";
import { BackgroundMusic } from "@/components/effects/BackgroundMusic";
import { WhatsAppButton } from "@/components/effects/WhatsAppButton";
import { siteMetadataBase } from "@/lib/site-metadata";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#C41E3A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: "Rudra Narayana Hindu Temple - Austin, TX | Pooja & Vedic Services",
    template: "%s | Rudra Narayana Hindu Temple",
  },
  description:
    "Austin's premier Hindu temple offering traditional Vedic poojas, homams, weddings, samskaras, and spiritual services. Serving Kyle, Manor, Round Rock, and greater Texas area. Book online or call (512) 545-0473.",
  keywords: [
    "Hindu Temple Austin",
    "Pooja Services Texas",
    "Vedic Rituals Austin TX",
    "Homam Austin",
    "Hindu Wedding Texas",
    "Panchangam",
    "RNHT",
    "Rudra Narayana Hindu Temple",
    "Telugu Priest Austin",
    "Upanayanam Texas",
    "Gruhapravesam Austin",
    "Satyanarayan Pooja",
  ],
  authors: [{ name: "Rudra Narayana Hindu Temple" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rudra Narayana Hindu Temple",
    title: "Rudra Narayana Hindu Temple - Austin, TX",
    description:
      "Traditional Vedic poojas, homams, weddings & spiritual services in Austin, Texas. Book online today.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rudra Narayana Hindu Temple - Austin, TX",
    description:
      "Traditional Vedic poojas, homams, weddings & spiritual services in Austin, Texas.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HinduTemple",
  name: "Rudra Narayana Hindu Temple",
  alternateName: "RNHT",
  description:
    "Traditional Hindu temple serving the Austin, Texas area with Vedic poojas, homams, weddings, and spiritual services.",
  url: "https://rnht-platform.web.app",
  telephone: "+15125450473",
  email: "femtomax.inc@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Austin",
    addressRegion: "TX",
    addressCountry: "US",
  },
  areaServed: [
    "Austin", "Kyle", "Manor", "Round Rock", "Georgetown",
    "San Antonio", "Dallas", "Houston", "Lakeway", "Bee Cave",
    "Leander", "Dripping Springs",
  ],
  nonprofitStatus: "Nonprofit501c3",
  openingHours: ["Mo-Su 09:00-12:00", "Mo-Su 17:00-20:00"],
  sameAs: [
    "https://wa.me/message/P3YRA2XY3GI7F1",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      style={
        {
          "--font-heading": '"Playfair Display", Georgia, "Times New Roman", serif',
          "--font-accent": '"Cormorant Garamond", Georgia, "Times New Roman", serif',
        } as CSSProperties
      }
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-body">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-temple-red focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <FallingPetals />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <BackgroundMusic />
      </body>
    </html>
  );
}
