/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// --- Mocks ---
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/font/google", () => ({
  Playfair_Display: () => ({
    className: "mock-playfair",
    variable: "--font-heading",
  }),
  Cormorant_Garamond: () => ({
    className: "mock-cormorant",
    variable: "--font-accent",
  }),
}));

vi.mock("@/store/cart", () => ({
  useCartStore: (sel: any) => {
    const s = { items: [], getItemCount: () => 0 };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/store/language", () => ({
  useLanguageStore: (sel: any) => {
    const s = { locale: "en", setLocale: vi.fn() };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/store/auth", () => {
  const s = { isAuthenticated: false, user: null, initialize: vi.fn() };
  const useAuthStore: any = (sel: any) => (typeof sel === "function" ? sel(s) : s);
  useAuthStore.getState = () => s;
  return { useAuthStore };
});
vi.mock("@/store/slideshow", () => ({
  useSlideshowStore: (sel: any) => {
    const s = {
      slides: [
        {
          id: "1",
          type: "image",
          url: "https://example.com/img.jpg",
          title: "Test",
          subtitle: "Sub",
          ctaText: "Learn More",
          ctaLink: "/services",
          isActive: true,
          showText: true,
          sortOrder: 0,
        },
      ],
      loading: false,
      fetchSlides: vi.fn(),
    };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { onAuthStateChange: vi.fn() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null }),
          order: () => ({ data: [] }),
        }),
        order: () => ({ data: [] }),
      }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/img.jpg" },
        }),
      }),
    },
  },
}));

// Mock child components
vi.mock("@/components/layout/Header", () => ({
  Header: () => <div data-testid="header" />,
}));
vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div data-testid="footer" />,
}));
vi.mock("@/components/effects/FallingPetals", () => ({
  FallingPetals: () => null,
}));
vi.mock("@/components/effects/BackgroundMusic", () => ({
  BackgroundMusic: () => null,
}));
vi.mock("@/components/effects/WhatsAppButton", () => ({
  WhatsAppButton: () => null,
}));

// Mock globals.css import
vi.mock("./globals.css", () => ({}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children within the layout", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child-content">Hello World</div>
      </RootLayout>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders the Header component", () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders the Footer component", () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("wraps children in an html element with lang attribute", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const html = container.querySelector("html");
    expect(html).not.toBeNull();
    expect(html).toHaveAttribute("lang", "en");
  });

  it("applies font CSS variables to the html element", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const html = container.querySelector("html");
    expect(html?.getAttribute("style")).toContain("--font-heading");
    expect(html?.getAttribute("style")).toContain("--font-accent");
  });

  it("renders a body element with layout classes", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const body = container.querySelector("body");
    expect(body).not.toBeNull();
    expect(body?.className).toContain("flex");
    expect(body?.className).toContain("min-h-screen");
    expect(body?.className).toContain("flex-col");
    expect(body?.className).toContain("font-body");
  });

  it("renders the skip-to-content accessibility link", () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(skipLink.className).toContain("sr-only");
  });

  it("renders children inside a main element with correct id", () => {
    render(
      <RootLayout>
        <div data-testid="page-content">Page</div>
      </RootLayout>
    );
    const main = document.getElementById("main-content");
    expect(main).not.toBeNull();
    expect(main?.tagName).toBe("MAIN");
    expect(main?.className).toContain("flex-1");
    expect(screen.getByTestId("page-content").closest("main")).toBe(main);
  });

  it("includes JSON-LD structured data script", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);

    const jsonLd = JSON.parse(scripts[0].textContent || "{}");
    expect(jsonLd["@type"]).toBe("HinduTemple");
    expect(jsonLd.name).toBe("Rudra Narayana Hindu Temple");
    expect(jsonLd.telephone).toBe("+15125450473");
  });

  it("places Header before main content", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const body = container.querySelector("body");
    if (body) {
      const children = Array.from(body.children);
      const headerIndex = children.findIndex(
        (el) => (el as HTMLElement).dataset.testid === "header"
      );
      const mainIndex = children.findIndex((el) => el.tagName === "MAIN");
      expect(headerIndex).toBeLessThan(mainIndex);
    }
  });

  it("places Footer after main content", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const body = container.querySelector("body");
    if (body) {
      const children = Array.from(body.children);
      const mainIndex = children.findIndex((el) => el.tagName === "MAIN");
      const footerIndex = children.findIndex(
        (el) => (el as HTMLElement).dataset.testid === "footer"
      );
      expect(mainIndex).toBeLessThan(footerIndex);
    }
  });

  it("renders structured data with correct address", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const jsonLd = JSON.parse(script?.textContent || "{}");
    expect(jsonLd.address.streetAddress).toBe("2025 Rushing Ranch Path");
    expect(jsonLd.address.addressLocality).toBe("Georgetown");
    expect(jsonLd.address.addressRegion).toBe("TX");
    expect(jsonLd.address.postalCode).toBe("78628");
    expect(jsonLd.address.addressCountry).toBe("US");
    // Geo coordinates for the temple's map/Business presence.
    expect(jsonLd.geo["@type"]).toBe("GeoCoordinates");
    expect(jsonLd.geo.latitude).toBeCloseTo(30.6265, 3);
    expect(jsonLd.geo.longitude).toBeCloseTo(-97.7957, 3);
  });

  it("renders structured data with area served", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const jsonLd = JSON.parse(script?.textContent || "{}");
    expect(jsonLd.areaServed).toContain("Austin");
    expect(jsonLd.areaServed).toContain("Kyle");
    expect(jsonLd.areaServed).toContain("Round Rock");
  });

  it("renders structured data with nonprofit status", () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const jsonLd = JSON.parse(script?.textContent || "{}");
    expect(jsonLd.nonprofitStatus).toBe("Nonprofit501c3");
  });

  it("renders multiple children correctly", () => {
    render(
      <RootLayout>
        <section data-testid="section1">Section 1</section>
        <section data-testid="section2">Section 2</section>
      </RootLayout>
    );
    expect(screen.getByTestId("section1")).toBeInTheDocument();
    expect(screen.getByTestId("section2")).toBeInTheDocument();
  });
});

describe("RootLayout metadata exports", () => {
  it("exports viewport configuration", async () => {
    const layoutModule = await import("@/app/layout");
    const viewport = (layoutModule as any).viewport;
    expect(viewport).toBeDefined();
    expect(viewport.themeColor).toBe("#B91C32");
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });

  it("exports metadata with correct title", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata).toBeDefined();
    expect(metadata.title.default).toContain("Rudra Narayana Hindu Temple");
    expect(metadata.title.template).toContain(
      "Rudra Narayana Hindu Temple"
    );
  });

  it("exports metadata with description", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata.description).toContain("Austin");
    expect(metadata.description).toContain("Vedic");
  });

  it("exports metadata with keywords", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata.keywords).toContain("Hindu Temple Austin");
    expect(metadata.keywords).toContain("RNHT");
  });

  it("exports metadata with OpenGraph config", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata.openGraph.type).toBe("website");
    expect(metadata.openGraph.locale).toBe("en_US");
    expect(metadata.openGraph.siteName).toBe(
      "Rudra Narayana Hindu Temple"
    );
  });

  it("exports metadata with Twitter card config", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata.twitter.card).toBe("summary_large_image");
  });

  it("exports metadata with robots config", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata.robots.index).toBe(true);
    expect(metadata.robots.follow).toBe(true);
  });

  it("exports metadata with canonical URL", async () => {
    const layoutModule = await import("@/app/layout");
    const metadata = (layoutModule as any).metadata;
    expect(metadata.metadataBase?.href).toBe(
      "https://rnht-platform.web.app/"
    );
    expect(metadata.alternates.canonical).toBe("/");
  });
});
