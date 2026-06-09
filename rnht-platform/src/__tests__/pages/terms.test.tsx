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

import TermsPage from "@/app/terms/page";

describe("TermsPage", () => {
  it("renders without crashing", () => {
    render(<TermsPage />);
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
  });

  it("displays the page heading", () => {
    render(<TermsPage />);
    const heading = screen.getByText("Terms of Use");
    expect(heading.tagName).toBe("H1");
  });

  it("displays the introductory paragraph", () => {
    render(<TermsPage />);
    expect(
      screen.getByText(/provides this web site/)
    ).toBeInTheDocument();
  });

  // Section headings
  describe("section headings", () => {
    it("renders Your acceptance heading", () => {
      render(<TermsPage />);
      expect(
        screen.getByText("Your acceptance of these terms and conditions")
      ).toBeInTheDocument();
    });

    it("renders terms may change heading", () => {
      render(<TermsPage />);
      expect(
        screen.getByText("These terms and conditions may change")
      ).toBeInTheDocument();
    });

    it("renders Privacy statement heading", () => {
      render(<TermsPage />);
      expect(screen.getByText("Privacy statement")).toBeInTheDocument();
    });

    it("renders Usernames passwords heading", () => {
      render(<TermsPage />);
      expect(
        screen.getByText("Usernames, passwords and security")
      ).toBeInTheDocument();
    });

    it("renders Ownership heading", () => {
      render(<TermsPage />);
      expect(
        screen.getByText("Ownership of this Site and its contents")
      ).toBeInTheDocument();
    });

    it("renders Your use heading", () => {
      render(<TermsPage />);
      expect(screen.getByText("Your use of this Site")).toBeInTheDocument();
    });

    it("renders Disclaimers heading", () => {
      render(<TermsPage />);
      expect(screen.getByText("Disclaimers")).toBeInTheDocument();
    });

    it("renders Limitation of liability heading", () => {
      render(<TermsPage />);
      expect(screen.getByText("Limitation of liability")).toBeInTheDocument();
    });

    it("renders Applicable laws heading", () => {
      render(<TermsPage />);
      expect(screen.getByText("Applicable laws")).toBeInTheDocument();
    });

    it("renders General heading", () => {
      render(<TermsPage />);
      expect(screen.getByText("General")).toBeInTheDocument();
    });
  });

  // Content sections
  describe("content sections", () => {
    it("displays acceptance paragraph", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/Please take a few minutes to carefully review/)
      ).toBeInTheDocument();
    });

    it("displays terms may change paragraph", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/We reserve the right to update or modify/)
      ).toBeInTheDocument();
    });

    it("displays privacy statement paragraph", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/We are committed to respecting the personal privacy/)
      ).toBeInTheDocument();
    });

    it("displays no usernames collected", () => {
      render(<TermsPage />);
      expect(
        screen.getByText("No usernames and passwords are collected by this Site.")
      ).toBeInTheDocument();
    });

    it("displays ownership content", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/This Site, including all its contents/)
      ).toBeInTheDocument();
    });

    it("displays use restrictions", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/You may not use any robot, spider, scraper/)
      ).toBeInTheDocument();
    });

    it("displays disclaimer text in uppercase", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/THE MATERIALS IN THIS SITE ARE PROVIDED/)
      ).toBeInTheDocument();
    });

    it("displays warranty disclaimer", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/WE DO NOT WARRANT THAT THE FUNCTIONS/)
      ).toBeInTheDocument();
    });

    it("displays limitation of liability text", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/UNDER NO CIRCUMSTANCES, INCLUDING, BUT NOT LIMITED TO/)
      ).toBeInTheDocument();
    });

    it("displays applicable laws - State of Texas", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/This Site is created and controlled by us in the State of Texas/)
      ).toBeInTheDocument();
    });

    it("displays general terms paragraph", () => {
      render(<TermsPage />);
      expect(
        screen.getByText(/We may revise these terms and conditions at any time/)
      ).toBeInTheDocument();
    });
  });

  // All section headings are h2
  describe("heading hierarchy", () => {
    it("has all section headings as h2 elements", () => {
      render(<TermsPage />);
      const headings = [
        "Your acceptance of these terms and conditions",
        "These terms and conditions may change",
        "Privacy statement",
        "Usernames, passwords and security",
        "Ownership of this Site and its contents",
        "Your use of this Site",
        "Disclaimers",
        "Limitation of liability",
        "Applicable laws",
        "General",
      ];
      headings.forEach((text) => {
        const el = screen.getByText(text);
        expect(el.tagName).toBe("H2");
      });
    });
  });
});
