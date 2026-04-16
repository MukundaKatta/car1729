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

import TransparencyPage from "@/app/transparency/page";

describe("TransparencyPage", () => {
  it("renders without crashing", () => {
    render(<TransparencyPage />);
    expect(screen.getByText("Financial Transparency")).toBeInTheDocument();
  });

  it("displays the page heading and description", () => {
    render(<TransparencyPage />);
    expect(screen.getByText("Financial Transparency")).toBeInTheDocument();
    expect(
      screen.getByText(/We believe in complete transparency with our community/)
    ).toBeInTheDocument();
  });

  it("displays 501(c)(3) status", () => {
    render(<TransparencyPage />);
    expect(
      screen.getByText(/RNHT is a registered 501\(c\)\(3\) nonprofit organization/)
    ).toBeInTheDocument();
  });

  // Key Metrics section
  describe("Key Metrics", () => {
    it("displays 2025 revenue", () => {
      render(<TransparencyPage />);
      // $285,000.00 appears in metrics and in the fiscal year section
      const amounts = screen.getAllByText("$285,000.00");
      expect(amounts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("2025 Revenue")).toBeInTheDocument();
    });

    it("displays active donors count", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("350+")).toBeInTheDocument();
      expect(screen.getByText("Active Donors")).toBeInTheDocument();
    });

    it("displays year over year growth", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("18%")).toBeInTheDocument();
      expect(screen.getByText("YoY Growth")).toBeInTheDocument();
    });

    it("displays building fund progress percentage", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("37.5%")).toBeInTheDocument();
      expect(screen.getByText("Building Fund Progress")).toBeInTheDocument();
    });
  });

  // Building Fund Progress section
  describe("Building Fund Campaign", () => {
    it("renders the section heading", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("Building Fund Campaign")).toBeInTheDocument();
    });

    it("displays milestone info", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText("Phase 1 — Foundation & Structure")
      ).toBeInTheDocument();
    });

    it("displays amount raised", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("$187,500.00")).toBeInTheDocument();
    });

    it("displays goal amount", () => {
      render(<TransparencyPage />);
      expect(screen.getByText(/Goal:.*\$500,000\.00/)).toBeInTheDocument();
    });

    it("displays donor count", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("145 donors")).toBeInTheDocument();
    });

    it("displays percentage raised", () => {
      render(<TransparencyPage />);
      expect(screen.getByText(/37\.5%.*raised/)).toBeInTheDocument();
    });

    it("renders a progress bar", () => {
      const { container } = render(<TransparencyPage />);
      // Progress bar has an inline width style
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // Financial Statements section
  describe("Annual Financial Statements", () => {
    it("renders the section heading", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText("Annual Financial Statements")
      ).toBeInTheDocument();
    });

    it("renders fiscal year headings for both years", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("Fiscal Year 2025")).toBeInTheDocument();
      expect(screen.getByText("Fiscal Year 2024")).toBeInTheDocument();
    });

    it("renders Download PDF buttons for each year", () => {
      render(<TransparencyPage />);
      const downloadButtons = screen.getAllByText("Download PDF");
      expect(downloadButtons).toHaveLength(2);
    });

    // 2025 Financial Data
    describe("Fiscal Year 2025", () => {
      it("displays total revenue", () => {
        render(<TransparencyPage />);
        const totalRevenues = screen.getAllByText("Total Revenue");
        expect(totalRevenues.length).toBeGreaterThanOrEqual(1);
      });

      it("displays total expenses", () => {
        render(<TransparencyPage />);
        const totalExpenses = screen.getAllByText("Total Expenses");
        expect(totalExpenses.length).toBeGreaterThanOrEqual(1);
      });

      it("displays net surplus", () => {
        render(<TransparencyPage />);
        const netSurplus = screen.getAllByText("Net Surplus");
        expect(netSurplus.length).toBeGreaterThanOrEqual(1);
      });

      it("displays income breakdown heading", () => {
        render(<TransparencyPage />);
        const incomeBreakdowns = screen.getAllByText("Income Breakdown");
        expect(incomeBreakdowns).toHaveLength(2); // one per fiscal year
      });

      it("displays expense breakdown heading", () => {
        render(<TransparencyPage />);
        const expenseBreakdowns = screen.getAllByText("Expense Breakdown");
        expect(expenseBreakdowns).toHaveLength(2);
      });
    });

    // Income categories
    describe("income categories", () => {
      it("displays Donations & Contributions for both years", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Donations & Contributions");
        expect(items).toHaveLength(2);
      });

      it("displays Service Fees", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Service Fees (Poojas & Ceremonies)");
        expect(items).toHaveLength(2);
      });

      it("displays Event Sponsorships", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Event Sponsorships");
        expect(items).toHaveLength(2);
      });

      it("displays Education Program Fees", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Education Program Fees");
        expect(items).toHaveLength(2);
      });

      it("displays Prasadam & Gift Shop", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Prasadam & Gift Shop");
        expect(items).toHaveLength(2);
      });
    });

    // Expense categories
    describe("expense categories", () => {
      it("displays Priest Services & Compensation", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Priest Services & Compensation");
        expect(items).toHaveLength(2);
      });

      it("displays Temple Operations & Maintenance", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Temple Operations & Maintenance");
        expect(items).toHaveLength(2);
      });

      it("displays Rent & Utilities", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Rent & Utilities");
        expect(items).toHaveLength(2);
      });

      it("displays Community Programs", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Community Programs (Annadanam, etc.)");
        expect(items).toHaveLength(2);
      });

      it("displays Education & Cultural Programs", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Education & Cultural Programs");
        expect(items).toHaveLength(2);
      });

      it("displays Insurance & Compliance", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Insurance & Compliance");
        expect(items).toHaveLength(2);
      });

      it("displays Marketing & Technology", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Marketing & Technology");
        expect(items).toHaveLength(2);
      });

      it("displays Administrative Expenses", () => {
        render(<TransparencyPage />);
        const items = screen.getAllByText("Administrative Expenses");
        expect(items).toHaveLength(2);
      });
    });

    // Financial amounts
    describe("financial amounts", () => {
      it("displays 2025 revenue amount", () => {
        render(<TransparencyPage />);
        // $285,000.00 appears in metrics and in the fiscal year section
        const amounts = screen.getAllByText("$285,000.00");
        expect(amounts.length).toBeGreaterThanOrEqual(1);
      });

      it("displays 2025 expenses amount", () => {
        render(<TransparencyPage />);
        expect(screen.getByText("$248,000.00")).toBeInTheDocument();
      });

      it("displays 2025 net surplus amount", () => {
        render(<TransparencyPage />);
        expect(screen.getByText("$37,000.00")).toBeInTheDocument();
      });

      it("displays 2024 revenue amount", () => {
        render(<TransparencyPage />);
        expect(screen.getByText("$242,000.00")).toBeInTheDocument();
      });

      it("displays 2024 expenses amount", () => {
        render(<TransparencyPage />);
        expect(screen.getByText("$218,000.00")).toBeInTheDocument();
      });

      it("displays 2024 net surplus amount", () => {
        render(<TransparencyPage />);
        // $24,000.00 appears twice: once for 2024 net surplus and once for
        // 2024 Community Programs expense, so use getAllByText
        const matches = screen.getAllByText("$24,000.00");
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // Donor Recognition Wall
  describe("Donor Recognition Wall", () => {
    it("renders the section heading", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("Donor Recognition Wall")).toBeInTheDocument();
    });

    it("displays opt-in note", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText(
          "We gratefully acknowledge our generous supporters (opt-in only)."
        )
      ).toBeInTheDocument();
    });

    it("renders tier names", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("Platinum ($10,000+)")).toBeInTheDocument();
      expect(screen.getByText("Gold ($5,000+)")).toBeInTheDocument();
      expect(screen.getByText("Silver ($1,000+)")).toBeInTheDocument();
    });

    it("renders Platinum tier donors", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("The Sharma Family")).toBeInTheDocument();
      expect(screen.getByText("The Reddy Foundation")).toBeInTheDocument();
    });

    it("renders Gold tier donors", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("Sri & Smt. Venkat Rao")).toBeInTheDocument();
      expect(screen.getByText("The Iyer Family")).toBeInTheDocument();
      expect(screen.getByText("Dr. Ravi & Priya Kumar")).toBeInTheDocument();
    });

    it("renders Silver tier donors", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("The Nair Family")).toBeInTheDocument();
      expect(screen.getByText("Sri Krishna Murthy")).toBeInTheDocument();
      expect(screen.getByText("Smt. Lakshmi Devi")).toBeInTheDocument();
      expect(screen.getByText("The Gupta Family")).toBeInTheDocument();
      expect(screen.getByText("Sri Ramesh & Anita Sharma")).toBeInTheDocument();
      expect(screen.getByText("The Patel Family")).toBeInTheDocument();
      expect(screen.getByText("Dr. Suresh Babu")).toBeInTheDocument();
    });

    it("renders Anonymous donors", () => {
      render(<TransparencyPage />);
      // Anonymous appears in Platinum (1), Gold (1), Silver (1) = 3 total
      const anonymousDonors = screen.getAllByText("Anonymous");
      expect(anonymousDonors).toHaveLength(3);
    });
  });

  // IRS Compliance section
  describe("IRS Compliance & Tax Information", () => {
    it("renders the section heading", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText("IRS Compliance & Tax Information")
      ).toBeInTheDocument();
    });

    it("displays tax-exempt description", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText(/Rudra Narayana Hindu Temple is a registered 501\(c\)\(3\)/)
      ).toBeInTheDocument();
    });

    it("displays EIN number placeholder", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("EIN: XX-XXXXXXX")).toBeInTheDocument();
    });

    it("displays state of incorporation", () => {
      render(<TransparencyPage />);
      expect(screen.getByText("State of Incorporation: Nevada")).toBeInTheDocument();
    });

    it("displays Form 990 info", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText("Annual Form 990 filed with the IRS")
      ).toBeInTheDocument();
    });

    it("displays tax receipt info", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText("Tax receipts issued for all donations over $10")
      ).toBeInTheDocument();
    });

    it("renders Download IRS Determination Letter button", () => {
      render(<TransparencyPage />);
      expect(
        screen.getByText("Download IRS Determination Letter")
      ).toBeInTheDocument();
    });
  });
});
