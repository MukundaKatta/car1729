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
      signInWithOAuth: vi.fn(),
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
  useCartStore: () => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    getTotal: () => 0,
    getItemCount: () => 0,
  }),
}));
vi.mock("@/store/language", () => ({
  useLanguageStore: () => ({ locale: "en", setLocale: vi.fn() }),
}));
vi.mock("@/store/auth", () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
    initialize: vi.fn(),
  }),
}));

import PriestsPage from "@/app/priests/page";

describe("PriestsPage", () => {
  it("renders without crashing", () => {
    render(<PriestsPage />);
  });

  it("displays the page heading", () => {
    render(<PriestsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /our priests/i })
    ).toBeInTheDocument();
  });

  it("shows the subtitle text", () => {
    render(<PriestsPage />);
    expect(
      screen.getByText(/our learned priests bring decades/i)
    ).toBeInTheDocument();
  });

  it("displays Pt. Shri Aditya Sharma", () => {
    render(<PriestsPage />);
    expect(
      screen.getByRole("heading", { name: /Pt\. Shri Aditya Sharma/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Founder & Head Priest")).toBeInTheDocument();
  });

  it("displays Pt. Shri Raghurama Sharma", () => {
    render(<PriestsPage />);
    expect(
      screen.getByRole("heading", { name: /Pt\. Shri Raghurama Sharma/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Senior Priest")).toBeInTheDocument();
  });

  it("shows initials for both priests", () => {
    render(<PriestsPage />);
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.getByText("RS")).toBeInTheDocument();
  });

  it("shows experience for both priests", () => {
    render(<PriestsPage />);
    expect(screen.getByText(/20\+ years experience/i)).toBeInTheDocument();
    expect(screen.getByText(/15\+ years experience/i)).toBeInTheDocument();
  });

  it("shows languages for Aditya Sharma", () => {
    render(<PriestsPage />);
    // Languages appear for both priests
    expect(screen.getAllByText("English").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Telugu").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tamil").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Hindi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Sanskrit").length).toBeGreaterThanOrEqual(1);
  });

  it("shows phone numbers for both priests", () => {
    render(<PriestsPage />);
    expect(screen.getByText("(512) 545-0473")).toBeInTheDocument();
    expect(screen.getByText("(512) 998-0122")).toBeInTheDocument();
  });

  it("shows email addresses", () => {
    render(<PriestsPage />);
    const emails = screen.getAllByText("femtomax.inc@gmail.com");
    expect(emails).toHaveLength(2);
  });

  it("shows education information", () => {
    render(<PriestsPage />);
    expect(screen.getByText(/Krishna Yajurvedam.*Andhra Pradesh/i)).toBeInTheDocument();
    expect(screen.getByText(/Krishna Yajur Veda.*Tirupati/i)).toBeInTheDocument();
  });

  it("shows specialization information", () => {
    render(<PriestsPage />);
    expect(
      screen.getByText(/Krishna Yajurvedam, Yajurveda Smartam, Vastu, Astrology/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Krishna Yajurveda, Smartha Traditions, Panchadasa Karmas/i)
    ).toBeInTheDocument();
  });

  it("shows bio for both priests", () => {
    render(<PriestsPage />);
    expect(
      screen.getByText(/highly respected Hindu priest with over 20 years/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/distinguished Vedic scholar/i)
    ).toBeInTheDocument();
  });

  it("shows services offered", () => {
    render(<PriestsPage />);
    expect(screen.getAllByText("All Poojas")).toHaveLength(2);
    expect(
      screen.getAllByText("Weddings (Vivaham)")
    ).toHaveLength(2);
    expect(
      screen.getAllByText("Homams & Yagnas")
    ).toHaveLength(2);
    expect(screen.getByText("Vastu Consultation")).toBeInTheDocument();
    expect(screen.getByText("Jyotisham")).toBeInTheDocument();
    expect(screen.getByText("Panchadasa Karmas")).toBeInTheDocument();
  });

  it("shows availability badges for Aditya Sharma (Temple, Home, Online)", () => {
    render(<PriestsPage />);
    // Aditya has atTemple, outsideTemple, and online
    const templeBadges = screen.getAllByText("Temple");
    expect(templeBadges.length).toBeGreaterThanOrEqual(2);
    const homeBadges = screen.getAllByText("Home");
    expect(homeBadges.length).toBeGreaterThanOrEqual(2);
    // Online is only for Aditya
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows stats for both priests", () => {
    render(<PriestsPage />);
    expect(screen.getByText("20+ yrs")).toBeInTheDocument();
    expect(screen.getByText("15+ yrs")).toBeInTheDocument();
    expect(screen.getByText("Since 2013")).toBeInTheDocument();
    expect(screen.getByText("Since 2017")).toBeInTheDocument();
    expect(screen.getByText("Austin, TX")).toBeInTheDocument();
    expect(screen.getByText("Texas")).toBeInTheDocument();
  });

  it("has book links for both priests pointing to /services", () => {
    render(<PriestsPage />);
    const bookLinks = screen.getAllByRole("link", { name: /book with/i });
    expect(bookLinks).toHaveLength(2);
    bookLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/services");
    });
  });

  it("shows Book with Shri for Aditya Sharma", () => {
    render(<PriestsPage />);
    // Both priests have "Book with Shri ..." links
    const bookLinks = screen.getAllByRole("link", { name: /book with Shri/i });
    expect(bookLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Education section headers", () => {
    render(<PriestsPage />);
    const educationHeaders = screen.getAllByText("Education");
    expect(educationHeaders).toHaveLength(2);
  });

  it("renders Specialization section headers", () => {
    render(<PriestsPage />);
    const specHeaders = screen.getAllByText("Specialization");
    expect(specHeaders).toHaveLength(2);
  });

  it("renders About section headers", () => {
    render(<PriestsPage />);
    const aboutHeaders = screen.getAllByText("About");
    expect(aboutHeaders).toHaveLength(2);
  });

  it("renders Services Offered section headers", () => {
    render(<PriestsPage />);
    const servHeaders = screen.getAllByText("Services Offered");
    expect(servHeaders).toHaveLength(2);
  });
});
