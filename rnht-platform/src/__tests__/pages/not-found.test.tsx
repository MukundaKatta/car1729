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

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders without crashing", () => {
    render(<NotFound />);
  });

  it("displays the Page Not Found heading", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { level: 1, name: /page not found/i })
    ).toBeInTheDocument();
  });

  it("shows an explanatory message", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/the page you are looking for does not exist/i)
    ).toBeInTheDocument();
  });

  it("mentions the URL might be incorrect", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/the url might be incorrect/i)
    ).toBeInTheDocument();
  });

  it("has a Go Home link pointing to /", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("has a View Services link pointing to /services", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /view services/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/services");
  });

  it("has a View Gallery link pointing to /gallery", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /view gallery/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/gallery");
  });

  it("renders exactly three navigation links", () => {
    render(<NotFound />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
  });

  it("displays the prayer emoji", () => {
    render(<NotFound />);
    expect(screen.getByText("\uD83D\uDE4F")).toBeInTheDocument();
  });
});
