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

import Loading from "@/app/loading";

describe("Loading", () => {
  it("renders without crashing", () => {
    render(<Loading />);
  });

  it("displays the Loading... text", () => {
    render(<Loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders a spinner element", () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("spinner has the correct border styling", () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("rounded-full");
    expect(spinner).toHaveClass("border-4");
  });

  it("has proper centering layout", () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("items-center");
    expect(wrapper).toHaveClass("justify-center");
  });

  it("does not render any links or buttons", () => {
    render(<Loading />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
