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

import PrivacyPage from "@/app/privacy/page";

describe("PrivacyPage", () => {
  it("renders without crashing", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("displays the page heading", () => {
    render(<PrivacyPage />);
    const heading = screen.getByText("Privacy Policy");
    expect(heading.tagName).toBe("H1");
  });

  it("displays the last updated date", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    // Asserts a formatted date (e.g. "13 Jun 2026") is rendered, not a stale literal
    expect(screen.getByText(/\d{1,2}\s+\w{3}\s+\d{4}/)).toBeInTheDocument();
  });

  // Section headings
  describe("section headings", () => {
    it("renders Cookie Policy heading", () => {
      render(<PrivacyPage />);
      expect(screen.getByText("Cookie Policy")).toBeInTheDocument();
    });

    it("renders What are Cookies heading", () => {
      render(<PrivacyPage />);
      expect(screen.getByText("What are Cookies?")).toBeInTheDocument();
    });

    it("renders Links to other web sites heading", () => {
      render(<PrivacyPage />);
      expect(screen.getByText("Links to other web sites")).toBeInTheDocument();
    });
  });

  // Content
  describe("content sections", () => {
    it("displays cookie description text", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/Our website uses Cookies, as almost all websites do/)
      ).toBeInTheDocument();
    });

    it("displays what cookies are explanation", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/Cookies are small text files which a website may install/)
      ).toBeInTheDocument();
    });

    it("displays cookie functions explanation", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/There are many functions Cookies serve/)
      ).toBeInTheDocument();
    });

    it("displays personal information in cookies info", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/Certain Cookies contain Personal Information/)
      ).toBeInTheDocument();
    });

    it("displays no tracking cookies statement", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText("No tracking or targeting cookies are used by our website.")
      ).toBeInTheDocument();
    });

    it("displays data collection statement", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/We may collect data that personally identifies you/)
      ).toBeInTheDocument();
    });

    it("displays no data sale statement", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/We do not sell this data to any 3rd party/)
      ).toBeInTheDocument();
    });

    it("displays browser settings warning", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/if you use your browser settings to block all Cookies/)
      ).toBeInTheDocument();
    });

    it("displays embedded content section", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/This Site may contain embedded content from/)
      ).toBeInTheDocument();
    });

    it("displays share page widget info", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/share page/)
      ).toBeInTheDocument();
    });
  });

  // External links
  describe("external links", () => {
    it("renders allaboutcookies.org link", () => {
      render(<PrivacyPage />);
      const link = screen.getByText("www.allaboutcookies.org");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "https://www.allaboutcookies.org");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  // Social media mentions
  describe("social media references", () => {
    it("mentions YouTube, Twitter, LinkedIn, Facebook", () => {
      render(<PrivacyPage />);
      expect(
        screen.getByText(/YouTube, Twitter, LinkedIn or Facebook/)
      ).toBeInTheDocument();
    });
  });
});
