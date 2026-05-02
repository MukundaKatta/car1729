/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { samplePanchangam } from "@/lib/sample-data";

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
  useCartStore: (selector: any) => {
    const state = {
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      getTotal: () => 0,
      getItemCount: () => 0,
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));
vi.mock("@/store/language", () => ({
  useLanguageStore: (selector: any) => {
    const state = { locale: "en", setLocale: vi.fn() };
    return typeof selector === "function" ? selector(state) : state;
  },
}));
vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => {
    const state = {
      isAuthenticated: false,
      user: null,
      authUser: null,
      bookings: [],
      donations: [],
      activities: [],
      initialize: vi.fn(),
      sendOtp: vi.fn(),
      verifyOtp: vi.fn(),
      logout: vi.fn(),
      addDonation: vi.fn(),
      addBooking: vi.fn(),
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

vi.mock("@/lib/panchangam", async () => {
  const actual = await vi.importActual<typeof import("@/lib/panchangam")>(
    "@/lib/panchangam"
  );

  return {
    ...actual,
    computePanchangam: vi.fn(async (location) => ({
      ...samplePanchangam,
      location: location.label,
      date: "2026-05-02",
      sunrise: "6:22 AM",
      sunset: "6:01 PM",
      tithi: {
        ...samplePanchangam.tithi,
        name: "Dwadashi",
        paksha: "Shukla",
      },
      nakshatra: {
        ...samplePanchangam.nakshatra,
        name: "Pushya",
      },
      rahu_kalam: {
        ...samplePanchangam.rahu_kalam,
        start: "10:42 AM",
        end: "12:12 PM",
      },
    })),
  };
});

import PanchangamPage from "@/app/panchangam/page";

describe("PanchangamPage", () => {
  it("renders without crashing", () => {
    render(<PanchangamPage />);
    const matches = screen.getAllByText("Daily Panchangam");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("displays the page heading", () => {
    render(<PanchangamPage />);
    const headings = screen.getAllByRole("heading", { name: /daily panchangam/i });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("displays the subtitle description", () => {
    render(<PanchangamPage />);
    expect(
      screen.getByText(/your daily hindu almanac with tithi/i)
    ).toBeInTheDocument();
  });

  it("renders the 'What is Panchangam?' section", () => {
    render(<PanchangamPage />);
    expect(
      screen.getByRole("heading", { name: /what is panchangam/i })
    ).toBeInTheDocument();
  });

  it("describes the five key panchangam attributes", () => {
    render(<PanchangamPage />);
    // These labels appear in both the page description and the PanchangamWidget
    expect(screen.getAllByText("Tithi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Vaara/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Nakshatra").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Yoga").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Karana").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 'Understanding Timings' section", () => {
    render(<PanchangamPage />);
    expect(
      screen.getByRole("heading", { name: /understanding timings/i })
    ).toBeInTheDocument();
  });

  it("displays Rahu Kalam information", () => {
    render(<PanchangamPage />);
    expect(screen.getByText("Rahu Kalam:")).toBeInTheDocument();
    expect(
      screen.getByText(/avoid starting new activities/i)
    ).toBeInTheDocument();
  });

  it("displays Yama Gandam information", () => {
    render(<PanchangamPage />);
    expect(screen.getByText("Yama Gandam:")).toBeInTheDocument();
    expect(
      screen.getByText(/avoid important decisions/i)
    ).toBeInTheDocument();
  });

  it("does NOT show Abhijit Muhurtham (removed from the expanded view)", () => {
    render(<PanchangamPage />);
    expect(screen.queryByText("Abhijit Muhurtham:")).not.toBeInTheDocument();
  });

  it("renders the PanchangamWidget with computed data", async () => {
    render(<PanchangamPage />);
    expect(await screen.findByText(/pushya/i)).toBeInTheDocument();
  });

  it("displays sunrise and sunset times", async () => {
    render(<PanchangamPage />);
    expect(await screen.findByText(/6:22 AM/)).toBeInTheDocument();
    expect(await screen.findByText(/6:01 PM/)).toBeInTheDocument();
  });

  it("displays tithi information from computed data", async () => {
    render(<PanchangamPage />);
    expect(await screen.findByText(/shukla dwadashi/i)).toBeInTheDocument();
  });

  it("displays rahu kalam timings from computed data", async () => {
    render(<PanchangamPage />);
    expect(await screen.findByText(/10:42 AM/)).toBeInTheDocument();
    expect(await screen.findByText(/12:12 PM/)).toBeInTheDocument();
  });
});
