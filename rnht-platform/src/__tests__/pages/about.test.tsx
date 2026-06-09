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

import AboutPage from "@/app/about/page";

describe("AboutPage", () => {
  it("renders without crashing", () => {
    render(<AboutPage />);
  });

  it("displays the page heading", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /about us/i })
    ).toBeInTheDocument();
  });

  it("mentions Rudra Narayana Hindu Temple", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/Rudra Narayana Hindu Temple \(RNHT\)/i)
    ).toBeInTheDocument();
  });

  it("mentions the founding year 2022", () => {
    render(<AboutPage />);
    expect(screen.getByText(/established in 2022/i)).toBeInTheDocument();
  });

  it("mentions Pandit Aditya Sharma as founder", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/founded by Pandit Aditya Sharma/i)
    ).toBeInTheDocument();
  });

  it("mentions Pandit Raghuram Sharma", () => {
    render(<AboutPage />);
    const matches = screen.getAllByText(/Pandit Raghuram Sharma/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("mentions Austin, Texas area", () => {
    render(<AboutPage />);
    expect(screen.getByText(/Austin, Texas area/i)).toBeInTheDocument();
  });

  it("mentions weddings, pujas, and rituals", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/weddings, pujas, and other rituals/i)
    ).toBeInTheDocument();
  });

  it("mentions Vedic experience", () => {
    render(<AboutPage />);
    expect(screen.getByText(/Vedic experience/i)).toBeInTheDocument();
  });

  it("has a link to the priests page", () => {
    render(<AboutPage />);
    const link = screen.getByRole("link", { name: /meet our priests/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/priests");
  });

  it("has a link to the services page", () => {
    render(<AboutPage />);
    const link = screen.getByRole("link", { name: /view services/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/services");
  });

  it("has a Contact Us link to the temple WhatsApp", () => {
    render(<AboutPage />);
    const link = screen.getByRole("link", { name: /contact us/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/message/P3YRA2XY3GI7F1"
    );
  });

  it("renders three CTA links in the footer section", () => {
    render(<AboutPage />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("contains spiritual growth text", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/spiritual growth, peace, and connection/i)
    ).toBeInTheDocument();
  });

  it("describes the temple as a thriving spiritual center", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/thriving spiritual center/i)
    ).toBeInTheDocument();
  });
});
