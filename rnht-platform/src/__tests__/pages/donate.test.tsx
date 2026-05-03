/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
let searchParamsState = new URLSearchParams();

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
  usePathname: () => "/donate",
  useSearchParams: () => searchParamsState,
}));

const donationTypesMock = [
  {
    id: "general",
    slug: "general",
    name: "General Temple Fund",
    description: "Unrestricted contribution",
    custom_fields: [],
    is_active: true,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "priest",
    slug: "priest",
    name: "Priest Fund",
    description: "Support our priests",
    custom_fields: [
      { key: "in_honor_of", label: "In honor of", type: "text", required: false },
    ],
    is_active: true,
    sort_order: 2,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: (table: string) => {
      if (table === "donation_types") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: donationTypesMock, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
        }),
      };
    },
  },
}));

vi.mock("@/store/auth", () => ({
  useAuthStore: (sel: any) => {
    const s = {
      user: null,
      isAuthenticated: false,
      loading: false,
      initialized: true,
      authUser: null,
    };
    return typeof sel === "function" ? sel(s) : s;
  },
}));

vi.mock("@/store/language", () => ({
  useLanguageStore: (sel: any) => {
    const s = { locale: "en", setLocale: vi.fn() };
    return typeof sel === "function" ? sel(s) : s;
  },
}));

import DonatePage from "@/app/donate/page";

describe("DonatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState = new URLSearchParams();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );
  });

  it("renders the donation page heading", async () => {
    render(<DonatePage />);
    expect(
      screen.getByRole("heading", { name: /support our temple|donate/i, level: 1 })
    ).toBeInTheDocument();
  });

  it("keeps guest giving and also shows sign-in and sign-up options", () => {
    render(<DonatePage />);
    expect(
      screen.getByText(/Guest donation stays open, and devotee account options are here too/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Already a devotee\?/i })).toHaveAttribute(
      "href",
      "/login?mode=signin"
    );
    expect(screen.getByRole("link", { name: /New devotee\?/i })).toHaveAttribute(
      "href",
      "/login?mode=signup"
    );
  });

  it("loads fund types from the database and renders them", async () => {
    render(<DonatePage />);
    await waitFor(() => {
      // "General Temple Fund" also appears in the sidebar summary after load,
      // so there can be 2+ matches.
      expect(screen.getAllByText("General Temple Fund").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Priest Fund")).toBeInTheDocument();
  });

  it("does NOT render any of the removed legacy fund UI", async () => {
    render(<DonatePage />);
    expect(screen.queryByText(/Deity-Specific Donations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lord Ganesha Seva/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dollar A Day Program/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Make this donation anonymous/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Recurring Donation/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/In memory of, in honor of/i)
    ).not.toBeInTheDocument();
  });

  it("shows a single custom-amount input", () => {
    render(<DonatePage />);
    const input = screen.getByPlaceholderText("Enter any amount");
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).type).toBe("number");
  });

  it("marks email as required and does not require name", () => {
    render(<DonatePage />);
    const email = screen.getByPlaceholderText("your@email.com");
    expect(email).toBeRequired();
    const name = screen.getByPlaceholderText("Your name (optional)");
    expect(name).not.toBeRequired();
  });

  it("updates the donation summary when an amount is entered", () => {
    render(<DonatePage />);
    const input = screen.getByPlaceholderText("Enter any amount") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "125" } });
    expect(screen.getByText("$125.00")).toBeInTheDocument();
  });

  it("disables the donate button when amount is missing or invalid", () => {
    render(<DonatePage />);
    const button = screen.getByRole("button", { name: /^donate\s*\$/i });
    expect(button).toBeDisabled();
  });

  it("enables the donate button once a valid email + amount are provided", () => {
    render(<DonatePage />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "devotee@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter any amount"), {
      target: { value: "50" },
    });
    const button = screen.getByRole("button", { name: /donate\s*\$50/i });
    expect(button).not.toBeDisabled();
  });

  it("renders all three payment-method options", () => {
    render(<DonatePage />);
    expect(screen.getByText("Card / Apple Pay")).toBeInTheDocument();
    expect(screen.getByText("PayPal")).toBeInTheDocument();
    expect(screen.getByText("Zelle")).toBeInTheDocument();
  });

  it("renders custom fields declared on the selected fund", async () => {
    render(<DonatePage />);
    await waitFor(() => {
      expect(screen.getByText("Priest Fund")).toBeInTheDocument();
    });
    const priestRadio = screen
      .getByText("Priest Fund")
      .closest("label")
      ?.querySelector("input[type='radio']") as HTMLInputElement;
    fireEvent.click(priestRadio);
    expect(screen.getByText("In honor of")).toBeInTheDocument();
  });

  it("does not trust success without a payment token or session", async () => {
    searchParamsState = new URLSearchParams("success=true");
    render(<DonatePage />);

    const errors = await screen.findAllByText(/We couldn't verify your donation yet/i);
    expect(errors.length).toBeGreaterThan(0);
    expect(screen.queryByText(/Your donation of/i)).not.toBeInTheDocument();
  });

  it("verifies Stripe donations before showing success", async () => {
    searchParamsState = new URLSearchParams("success=true&session_id=cs_test_123");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verified: true,
          amount: 108,
          fundLabel: "General Temple Fund",
        }),
        { status: 200 }
      )
    );

    render(<DonatePage />);

    expect(
      await screen.findByText(/Your donation of/i)
    ).toBeInTheDocument();
    expect(screen.getByText("$108.00")).toBeInTheDocument();
  });
});
