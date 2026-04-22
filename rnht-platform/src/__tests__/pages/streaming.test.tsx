import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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

import StreamingPage from "@/app/streaming/page";

describe("StreamingPage", () => {
  it("renders without crashing", () => {
    render(<StreamingPage />);
    expect(screen.getByText("Live Darshan & Streaming")).toBeInTheDocument();
  });

  it("displays the page heading and description", () => {
    render(<StreamingPage />);
    expect(screen.getByText("Live Darshan & Streaming")).toBeInTheDocument();
    expect(
      screen.getByText(/Experience the divine from anywhere/)
    ).toBeInTheDocument();
  });

  // Live Streams section
  describe("Live Streams", () => {
    it("renders live stream titles", () => {
      render(<StreamingPage />);
      expect(screen.getByText("Morning Aarti & Suprabhatam")).toBeInTheDocument();
      expect(screen.getByText("Evening Aarti & Deeparadhana")).toBeInTheDocument();
    });

    it("renders stream schedules", () => {
      render(<StreamingPage />);
      expect(
        screen.getAllByText("Daily 7:00 AM - 7:30 AM CST").length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText("Daily 7:00 PM - 7:30 PM CST").length
      ).toBeGreaterThanOrEqual(1);
    });

    it("renders stream descriptions", () => {
      render(<StreamingPage />);
      expect(
        screen.getByText(/Start your day with the divine morning aarti/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Join the evening Deeparadhana ceremony live/)
      ).toBeInTheDocument();
    });

    it("shows LIVE badge for active streams", () => {
      render(<StreamingPage />);
      expect(screen.getByText("LIVE")).toBeInTheDocument();
    });

    it("shows a link to watch the live stream on YouTube", () => {
      render(<StreamingPage />);
      expect(
        screen.getAllByRole("link", { name: /watch live on youtube/i }).length
      ).toBeGreaterThan(0);
    });

    it("shows next stream info for offline streams", () => {
      render(<StreamingPage />);
      expect(
        screen.getByText("Next stream: Daily 7:00 PM - 7:30 PM CST")
      ).toBeInTheDocument();
    });

    it("renders Set Reminder buttons", () => {
      render(<StreamingPage />);
      const reminderButtons = screen.getAllByText("Set Reminder");
      expect(reminderButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("renders Chat button for live stream only", () => {
      render(<StreamingPage />);
      const chatButton = screen.getByRole("button", { name: /Chat/ });
      expect(chatButton).toBeInTheDocument();
    });
  });

  // Chat toggle
  describe("Live Chat toggle", () => {
    it("does not show chat panel initially", () => {
      render(<StreamingPage />);
      expect(screen.queryByText("Live Chat")).not.toBeInTheDocument();
    });

    it("opens chat panel when Chat button is clicked", () => {
      render(<StreamingPage />);
      const chatButton = screen.getByRole("button", { name: /Chat/ });
      fireEvent.click(chatButton);
      expect(screen.getByText("Live Chat")).toBeInTheDocument();
    });

    it("displays sample chat messages when chat is open", () => {
      render(<StreamingPage />);
      fireEvent.click(screen.getByRole("button", { name: /Chat/ }));
      expect(screen.getByText("Om Namah Shivaya!")).toBeInTheDocument();
      expect(screen.getByText("Beautiful aarti today")).toBeInTheDocument();
      expect(screen.getByText("Har Har Mahadev!")).toBeInTheDocument();
      expect(screen.getByText("Jai Sri Ram")).toBeInTheDocument();
    });

    it("displays chat usernames", () => {
      render(<StreamingPage />);
      fireEvent.click(screen.getByRole("button", { name: /Chat/ }));
      expect(screen.getByText("DevoteeR:")).toBeInTheDocument();
      expect(screen.getByText("PriyaS:")).toBeInTheDocument();
      expect(screen.getByText("VenkatK:")).toBeInTheDocument();
      expect(screen.getByText("MeeraJ:")).toBeInTheDocument();
    });

    it("displays chat input and send button", () => {
      render(<StreamingPage />);
      fireEvent.click(screen.getByRole("button", { name: /Chat/ }));
      expect(
        screen.getByPlaceholderText("Type a message...")
      ).toBeInTheDocument();
      expect(screen.getByText("Send")).toBeInTheDocument();
    });

    it("closes chat panel when Close button is clicked", () => {
      render(<StreamingPage />);
      fireEvent.click(screen.getByRole("button", { name: /Chat/ }));
      expect(screen.getByText("Live Chat")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Close"));
      expect(screen.queryByText("Live Chat")).not.toBeInTheDocument();
    });

    it("toggles chat panel off when Chat button is clicked again", () => {
      render(<StreamingPage />);
      const chatButton = screen.getByRole("button", { name: /Chat/ });
      fireEvent.click(chatButton);
      expect(screen.getByText("Live Chat")).toBeInTheDocument();
      fireEvent.click(chatButton);
      expect(screen.queryByText("Live Chat")).not.toBeInTheDocument();
    });
  });

  // Upcoming Streams section. The page filters out past-dated streams so the
  // fixture dates (2026-03/04) must be "future" for these assertions to hold.
  // Pin the clock to a pre-fixture date inside this block.
  describe("Upcoming Streams", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the Upcoming Streams heading", () => {
      render(<StreamingPage />);
      expect(screen.getByText("Upcoming Streams")).toBeInTheDocument();
    });

    it("renders all upcoming stream titles", () => {
      render(<StreamingPage />);
      expect(screen.getByText("Ugadi Special Abhishekam")).toBeInTheDocument();
      expect(
        screen.getByText("Sri Rama Navami — Sita Rama Kalyanotsavam")
      ).toBeInTheDocument();
      expect(screen.getByText("Hanuman Jayanti Celebrations")).toBeInTheDocument();
    });

    it("renders upcoming stream dates and times", () => {
      render(<StreamingPage />);
      expect(
        screen.getByText("March 29, 2026 at 9:00 AM CST")
      ).toBeInTheDocument();
      expect(
        screen.getByText("April 7, 2026 at 8:00 AM CST")
      ).toBeInTheDocument();
      expect(
        screen.getByText("April 13, 2026 at 6:00 AM CST")
      ).toBeInTheDocument();
    });

    it("renders countdown badges", () => {
      render(<StreamingPage />);
      // Countdowns are now dynamically computed; check pattern instead of hardcoded values
      const badges = screen.getAllByText(/^in .+$/);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it("renders Remind me buttons", () => {
      render(<StreamingPage />);
      const remindButtons = screen.getAllByText("Remind me");
      expect(remindButtons).toHaveLength(3);
    });
  });

  // YouTube CTA section (replaced the old Multi-Camera "Coming Soon" stub).
  describe("YouTube CTA section", () => {
    it("renders a Subscribe on YouTube call-to-action", () => {
      render(<StreamingPage />);
      expect(
        screen.getByRole("link", { name: /subscribe on youtube/i })
      ).toBeInTheDocument();
    });
  });

  // Past Recordings section
  describe("Past Recordings", () => {
    it("renders the Past Recordings heading", () => {
      render(<StreamingPage />);
      expect(screen.getByText("Past Recordings")).toBeInTheDocument();
    });

    it("renders the section description", () => {
      render(<StreamingPage />);
      expect(
        screen.getByText(
          "Watch recordings of past festivals, ceremonies, and special events."
        )
      ).toBeInTheDocument();
    });

    it("renders all past recording titles", () => {
      render(<StreamingPage />);
      expect(
        screen.getByText("Maha Shivaratri 2026 — Full Night Program")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Pongal / Makar Sankranti 2026")
      ).toBeInTheDocument();
      expect(screen.getByText("New Year Special Pooja 2026")).toBeInTheDocument();
      expect(
        screen.getByText("Diwali 2025 — Lakshmi Pooja & Fireworks")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Ganesh Chaturthi 2025 — Visarjan")
      ).toBeInTheDocument();
    });

    it("renders recording durations", () => {
      render(<StreamingPage />);
      expect(screen.getByText("6:45:00")).toBeInTheDocument();
      expect(screen.getByText("3:20:00")).toBeInTheDocument();
      expect(screen.getByText("2:15:00")).toBeInTheDocument();
      expect(screen.getByText("4:30:00")).toBeInTheDocument();
      expect(screen.getByText("2:45:00")).toBeInTheDocument();
    });

    it("renders recording dates", () => {
      render(<StreamingPage />);
      expect(screen.getByText("Feb 27, 2026")).toBeInTheDocument();
      expect(screen.getByText("Jan 14, 2026")).toBeInTheDocument();
      expect(screen.getByText("Jan 1, 2026")).toBeInTheDocument();
      expect(screen.getByText("Oct 20, 2025")).toBeInTheDocument();
      expect(screen.getByText("Sep 7, 2025")).toBeInTheDocument();
    });

    it("renders recording view counts", () => {
      render(<StreamingPage />);
      expect(screen.getByText("1,240 views")).toBeInTheDocument();
      expect(screen.getByText("890 views")).toBeInTheDocument();
      expect(screen.getByText("650 views")).toBeInTheDocument();
      expect(screen.getByText("2,100 views")).toBeInTheDocument();
      expect(screen.getByText("1,560 views")).toBeInTheDocument();
    });
  });
});
