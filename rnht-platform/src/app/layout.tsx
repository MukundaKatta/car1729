import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Nunito, Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FallingPetals } from "@/components/effects/FallingPetals";
import { BackgroundMusic } from "@/components/effects/BackgroundMusic";
import { WhatsAppButton } from "@/components/effects/WhatsAppButton";
import { StartupValidationNotice } from "@/components/system/StartupValidationNotice";
import { StoreRehydrator } from "@/components/system/StoreRehydrator";
import { CapacitorInit } from "@/components/CapacitorInit";
import { VisitTracker } from "@/components/VisitTracker";
import { CanonicalHost } from "@/components/system/CanonicalHost";
import { SITE_URL, siteMetadataBase } from "@/lib/site-metadata";
import "./globals.css";

// Self-hosted (bundled) so the headings render in a readable, warm rounded sans
// (Nunito) — and work offline in the native apps. Client asked for a more
// legible heading face than the previous high-contrast serif. Exposed as CSS
// variables used by --font-heading/--font-accent below.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#B91C32",
  width: "device-width",
  initialScale: 1,
  // Edge-to-edge in the native apps: lets env(safe-area-inset-*) resolve so
  // the header/footer pad around the iPhone notch/Dynamic Island and Android
  // system bars. No effect on normal desktop/mobile browser rendering.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: "Rudra Narayana Hindu Temple - Austin, TX | Pooja & Vedic Services",
    template: "%s | Rudra Narayana Hindu Temple",
  },
  description:
    "Austin's premier Hindu temple offering traditional Vedic poojas, homams, weddings, samskaras, and spiritual services. Serving Kyle, Manor, Round Rock, and greater Texas area. Book online or call (512) 545-0473.",
  manifest: "/manifest.json",
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
    images: [{ url: "/deity-collage.jpg", width: 2200, height: 1049, alt: "Rudra Narayana Hindu Temple" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rudra Narayana Hindu Temple - Austin, TX",
    description:
      "Traditional Vedic poojas, homams, weddings & spiritual services in Austin, Texas.",
    images: ["/deity-collage.jpg"],
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
  url: SITE_URL,
  telephone: "+15125450473",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2025 Rushing Ranch Path",
    addressLocality: "Georgetown",
    addressRegion: "TX",
    postalCode: "78628",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 30.626544,
    longitude: -97.795671,
  },
  areaServed: [
    "Austin", "Kyle", "Manor", "Round Rock",
    "San Antonio", "Dallas", "Houston", "Lakeway", "Bee Cave",
    "Leander", "Dripping Springs",
  ],
  nonprofitStatus: "Nonprofit501c3",
  openingHours: ["Mo-Su 09:00-12:00", "Mo-Su 17:00-20:00"],
  sameAs: [
    "https://wa.me/message/P3YRA2XY3GI7F1",
    "https://www.facebook.com/people/Rudra-Narayana-Hindu-Temple/61572697872055/",
    "https://www.instagram.com/rudranarayanahindutemple",
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
      className={`${nunito.variable} ${cormorant.variable}`}
      style={
        {
          "--font-heading": 'var(--font-nunito), system-ui, -apple-system, "Segoe UI", sans-serif',
          "--font-accent": 'var(--font-cormorant), Georgia, "Times New Roman", serif',
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
        <CapacitorInit />
        <StartupValidationNotice />
        <StoreRehydrator />
        <VisitTracker />
        <CanonicalHost />
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
