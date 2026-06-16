/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null }),
          order: () => ({ data: [], limit: () => ({ data: [] }) }),
        }),
        order: () => ({ data: [] }),
      }),
      insert: () => ({ then: vi.fn() }),
      update: () => ({ eq: () => ({ then: vi.fn() }) }),
      delete: () => ({ eq: () => ({ then: vi.fn() }) }),
    }),
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/img.jpg" },
        }),
      }),
    },
  },
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
vi.mock("@/store/auth", () => ({
  useAuthStore: (sel: any) => {
    const s = { isAuthenticated: false, user: null, initialize: vi.fn() };
    return typeof sel === "function" ? sel(s) : s;
  },
}));

import SponsorshipPage from "@/app/sponsorship/page";

describe("SponsorshipPage", () => {
  it("renders without crashing", () => {
    render(<SponsorshipPage />);
    expect(screen.getByText("Sponsorship & Packages")).toBeInTheDocument();
  });

  it("displays the page heading and description", () => {
    render(<SponsorshipPage />);
    expect(screen.getByText("Sponsorship & Packages")).toBeInTheDocument();
    expect(
      screen.getByText(/Sponsor temple festivals, deity ornaments, and save with bundled service/)
    ).toBeInTheDocument();
    expect(screen.getByText(/All sponsorships are tax-deductible/)).toBeInTheDocument();
  });

  // Service Bundles section
  describe("Service Packages section", () => {
    it("renders the section heading", () => {
      render(<SponsorshipPage />);
      expect(
        screen.getByText("Service Packages (Save up to 25%)")
      ).toBeInTheDocument();
    });

    it("renders the section description", () => {
      render(<SponsorshipPage />);
      expect(
        screen.getByText("Popular service combinations at discounted bundle prices.")
      ).toBeInTheDocument();
    });

    it("renders all four service bundles", () => {
      render(<SponsorshipPage />);
      expect(screen.getByText("New Home Package")).toBeInTheDocument();
      expect(screen.getByText("Wedding Ceremony Package")).toBeInTheDocument();
      expect(screen.getByText("Baby Ceremony Package")).toBeInTheDocument();
      expect(screen.getByText("Monthly Wellness Package")).toBeInTheDocument();
    });

    it("displays services within each bundle", () => {
      render(<SponsorshipPage />);
      // Service names may appear multiple times across bundles
      expect(screen.getAllByText("Ganapathi Homam").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Vastu Pooja").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Gruhapravesam").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Vivah Sanskar").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Namakaranam (Naming)").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Annaprasana (First Food)").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Aksharabhyasam (First Letters)").length).toBeGreaterThanOrEqual(1);
    });

    it("displays bundle durations", () => {
      render(<SponsorshipPage />);
      expect(screen.getByText("Full Day (6-8 hours)")).toBeInTheDocument();
      expect(screen.getByText("Full Day (8-10 hours)")).toBeInTheDocument();
      expect(screen.getByText("Per ceremony (1-2 hours each)")).toBeInTheDocument();
      expect(screen.getByText("Spread across the month")).toBeInTheDocument();
    });

    it("displays bundle prices and savings", () => {
      render(<SponsorshipPage />);
      // Bundle prices may appear in multiple places
      expect(screen.getAllByText("$501.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$1,251.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$351.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$116.00").length).toBeGreaterThanOrEqual(1);
      // Savings
      expect(screen.getByText("Save $103.00")).toBeInTheDocument();
      expect(screen.getByText("Save $253.00")).toBeInTheDocument();
      expect(screen.getByText("Save $102.00")).toBeInTheDocument();
      expect(screen.getByText("Save $30.00")).toBeInTheDocument();
    });

    it("renders Book Package links pointing to /services", () => {
      render(<SponsorshipPage />);
      const bookLinks = screen.getAllByText("Book Package");
      expect(bookLinks).toHaveLength(4);
      bookLinks.forEach((link) => {
        expect(link.closest("a")).toHaveAttribute("href", "/services");
      });
    });
  });

  // Festival Sponsorship section
  describe("Festival Sponsorship section", () => {
    it("renders the section heading", () => {
      render(<SponsorshipPage />);
      expect(screen.getByText("Festival Sponsorship")).toBeInTheDocument();
    });

    it("renders the section description", () => {
      render(<SponsorshipPage />);
      expect(
        screen.getByText("Sponsor upcoming festivals and receive recognition during the event.")
      ).toBeInTheDocument();
    });

    it("renders festival names and dates", () => {
      render(<SponsorshipPage />);
      expect(screen.getByText(/Ugadi 2026/)).toBeInTheDocument();
      expect(screen.getByText("March 29, 2026")).toBeInTheDocument();
      expect(screen.getByText(/Sri Rama Navami 2026/)).toBeInTheDocument();
      expect(screen.getByText("April 7, 2026")).toBeInTheDocument();
    });

    it("renders all tier names for each festival", () => {
      render(<SponsorshipPage />);
      // Each festival has Bronze, Silver, Gold, Platinum tiers (2 festivals = 2 each)
      const bronzeTiers = screen.getAllByText("Bronze");
      expect(bronzeTiers).toHaveLength(2);
      const silverTiers = screen.getAllByText("Silver");
      expect(silverTiers).toHaveLength(2);
      const goldTiers = screen.getAllByText("Gold");
      expect(goldTiers).toHaveLength(2);
      const platinumTiers = screen.getAllByText("Platinum");
      expect(platinumTiers).toHaveLength(2);
    });

    it("renders tier prices", () => {
      render(<SponsorshipPage />);
      // $101.00 appears multiple times (Bronze tiers)
      const bronzePrices = screen.getAllByText("$101.00");
      expect(bronzePrices.length).toBeGreaterThanOrEqual(2);
      const silverPrices = screen.getAllByText("$251.00");
      expect(silverPrices.length).toBeGreaterThanOrEqual(2);
    });

    it("renders tier perks", () => {
      render(<SponsorshipPage />);
      expect(screen.getAllByText("Prasadam").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Title sponsor recognition").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("VIP seating").length).toBeGreaterThanOrEqual(1);
    });

    it("renders sponsor CTAs for each tier (disabled until online sponsorship ships)", () => {
      render(<SponsorshipPage />);
      const sponsorButtons = screen.getAllByRole("button", { name: "Coming Soon" });
      // 4 tiers x 2 festivals = 8, plus deity ornament sponsor buttons
      expect(sponsorButtons.length).toBeGreaterThanOrEqual(8);
    });

    it("renders the (disabled) Sponsorship PDF buttons", () => {
      render(<SponsorshipPage />);
      const downloadButtons = screen.getAllByText(/Sponsorship PDF \(coming soon\)/);
      expect(downloadButtons).toHaveLength(2);
    });
  });

  // Deity Ornament section
  describe("Deity Ornament & Alankaram Sponsorship section", () => {
    it("renders the section heading", () => {
      render(<SponsorshipPage />);
      expect(
        screen.getByText("Deity Ornament & Alankaram Sponsorship")
      ).toBeInTheDocument();
    });

    it("renders the section description", () => {
      render(<SponsorshipPage />);
      expect(
        screen.getByText("Sponsor sacred ornaments and special alankaram for our temple deities.")
      ).toBeInTheDocument();
    });

    it("renders all deity names", () => {
      render(<SponsorshipPage />);
      expect(screen.getByText("Sri Rudra Narayana")).toBeInTheDocument();
      expect(screen.getByText("Lord Ganesha")).toBeInTheDocument();
      expect(screen.getByText("Goddess Lakshmi")).toBeInTheDocument();
      expect(screen.getByText("Lord Hanuman")).toBeInTheDocument();
    });

    it("renders ornament items with names and descriptions", () => {
      render(<SponsorshipPage />);
      expect(screen.getByText("Gold Crown (Kiritam)")).toBeInTheDocument();
      expect(screen.getByText("Gold-plated crown for the main deity")).toBeInTheDocument();
      expect(screen.getByText("Silver Kavacham")).toBeInTheDocument();
      expect(screen.getByText("Silk Vastram Set")).toBeInTheDocument();
      expect(screen.getByText("Flower Garland (Daily)")).toBeInTheDocument();
      expect(screen.getByText("Gold Ornament Set")).toBeInTheDocument();
      expect(screen.getByText("Modak Offering (108)")).toBeInTheDocument();
      expect(screen.getByText("Gold Jewelry Set")).toBeInTheDocument();
      expect(screen.getByText("Silk Saree")).toBeInTheDocument();
      expect(screen.getByText("Sindoor Alankaram")).toBeInTheDocument();
      expect(screen.getByText("Vadamala (108 Vadas)")).toBeInTheDocument();
      expect(screen.getByText("Butter Alankaram")).toBeInTheDocument();
    });

    it("renders ornament prices", () => {
      render(<SponsorshipPage />);
      // Prices may appear multiple times across deities
      expect(screen.getAllByText("$5,016.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$3,516.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$108.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$151.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("$75.00").length).toBeGreaterThanOrEqual(1);
    });

    it("renders sponsor CTAs for each ornament item (disabled until online sponsorship ships)", () => {
      render(<SponsorshipPage />);
      const sponsorButtons = screen.getAllByRole("button", { name: "Coming Soon" });
      // 4 + 2 + 2 + 3 = 11 deity items + 8 festival tiers = 19 total
      expect(sponsorButtons.length).toBe(19);
    });
  });
});
