import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

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

import CommunityPage from "@/app/community/page";

describe("CommunityPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders without crashing", () => {
    render(<CommunityPage />);
    expect(
      screen.getByRole("heading", { name: /community hub/i })
    ).toBeInTheDocument();
  });

  it("displays the page description with Vasudhaiva Kutumbakam", () => {
    render(<CommunityPage />);
    expect(
      screen.getByText(/serve, connect, and grow/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/vasudhaiva kutumbakam/i)
    ).toBeInTheDocument();
  });

  // Tabs
  it("renders all three tab buttons", () => {
    render(<CommunityPage />);
    expect(screen.getByText("Volunteer")).toBeInTheDocument();
    expect(screen.getByText("Annadanam")).toBeInTheDocument();
    expect(screen.getByText("Announcements")).toBeInTheDocument();
  });

  // Volunteer Tab (default)
  describe("Volunteer tab", () => {
    it("shows volunteer opportunities by default", () => {
      render(<CommunityPage />);
      expect(
        screen.getByText("Volunteer Opportunities")
      ).toBeInTheDocument();
    });

    it("displays all volunteer opportunity titles", () => {
      render(<CommunityPage />);
      expect(
        screen.getByText("Kitchen Seva (Annadanam)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Event Setup & Decoration")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sunday School Teaching")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Temple Administration")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Social Media & Photography")
      ).toBeInTheDocument();
    });

    it("shows spots available for each opportunity", () => {
      render(<CommunityPage />);
      expect(screen.getByText("5 spots available")).toBeInTheDocument();
      expect(screen.getByText("10 spots available")).toBeInTheDocument();
      expect(screen.getByText("3 spots available")).toBeInTheDocument();
      expect(screen.getByText("2 spots available")).toBeInTheDocument();
      expect(screen.getByText("4 spots available")).toBeInTheDocument();
    });

    it("displays shift information", () => {
      render(<CommunityPage />);
      expect(
        screen.getByText("Saturday 8 AM - 12 PM")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sunday 8 AM - 12 PM")
      ).toBeInTheDocument();
    });

    it("shows Sign Up buttons", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      expect(signUpButtons.length).toBe(5);
    });

    // Leaderboard
    it("displays Top Volunteers leaderboard", () => {
      render(<CommunityPage />);
      expect(screen.getByText("Top Volunteers (2026)")).toBeInTheDocument();
    });

    it("shows top volunteer names and hours", () => {
      render(<CommunityPage />);
      expect(screen.getByText("Smt. Radha Iyer")).toBeInTheDocument();
      expect(screen.getByText("120 hours")).toBeInTheDocument();
      expect(screen.getByText("Sri Venkat Raman")).toBeInTheDocument();
      expect(screen.getByText("96 hours")).toBeInTheDocument();
    });

    it("shows seva badges", () => {
      render(<CommunityPage />);
      expect(screen.getAllByText("Gold Seva").length).toBe(2);
      expect(screen.getAllByText("Silver Seva").length).toBe(2);
      expect(screen.getByText("Bronze Seva")).toBeInTheDocument();
    });

    it("shows Temple Seva Points info", () => {
      render(<CommunityPage />);
      expect(screen.getByText("Temple Seva Points")).toBeInTheDocument();
      expect(
        screen.getByText(/earn points for volunteering/i)
      ).toBeInTheDocument();
    });

    // Volunteer sign-up modal
    it("opens volunteer sign-up modal when Sign Up is clicked", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      fireEvent.click(signUpButtons[0]);
      expect(screen.getByText("Volunteer Sign-Up")).toBeInTheDocument();
      // "Kitchen Seva (Annadanam)" appears in both the list and the modal
      const kitchenSevaElements = screen.getAllByText("Kitchen Seva (Annadanam)");
      expect(kitchenSevaElements.length).toBeGreaterThanOrEqual(2);
    });

    it("displays form fields in volunteer modal", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      fireEvent.click(signUpButtons[0]);
      expect(
        screen.getByPlaceholderText("Full Name *")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Email *")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Phone")
      ).toBeInTheDocument();
      expect(screen.getByText("Preferred Shifts")).toBeInTheDocument();
    });

    it("shows shift checkboxes in modal matching the selected opportunity", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      fireEvent.click(signUpButtons[0]);
      // Kitchen seva has 3 shifts
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(3);
    });

    it("closes modal when Cancel is clicked", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      fireEvent.click(signUpButtons[0]);
      expect(screen.getByText("Volunteer Sign-Up")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Cancel"));
      expect(
        screen.queryByText("Volunteer Sign-Up")
      ).not.toBeInTheDocument();
    });

    it("submits sign-up and shows alert", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      fireEvent.click(signUpButtons[0]);
      fireEvent.change(screen.getByPlaceholderText("Full Name *"), { target: { value: "Rajesh Sharma" } });
      fireEvent.change(screen.getByPlaceholderText("Email *"), { target: { value: "rajesh@example.com" } });
      // The modal also has a Sign Up button
      const modalSignUp = screen.getAllByText("Sign Up");
      fireEvent.click(modalSignUp[modalSignUp.length - 1]);
      expect(window.alert).toHaveBeenCalledWith(
        "Thank you for signing up! You'll receive a confirmation email shortly."
      );
    });

    it("closes modal after sign-up submission", () => {
      render(<CommunityPage />);
      const signUpButtons = screen.getAllByText("Sign Up");
      fireEvent.click(signUpButtons[0]);
      fireEvent.change(screen.getByPlaceholderText("Full Name *"), { target: { value: "Rajesh Sharma" } });
      fireEvent.change(screen.getByPlaceholderText("Email *"), { target: { value: "rajesh@example.com" } });
      const modalSignUp = screen.getAllByText("Sign Up");
      fireEvent.click(modalSignUp[modalSignUp.length - 1]);
      expect(
        screen.queryByText("Volunteer Sign-Up")
      ).not.toBeInTheDocument();
    });
  });

  // Annadanam Tab
  describe("Annadanam tab", () => {
    it("shows Annadanam content when tab is clicked", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(
        screen.getByText(/annadanam — community meal service/i)
      ).toBeInTheDocument();
    });

    it("displays the Annadanam description", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(
        screen.getByText(/annadanam maha danam/i)
      ).toBeInTheDocument();
    });

    it("shows statistics", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(screen.getByText("1,200+")).toBeInTheDocument();
      expect(screen.getByText("45+")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("displays upcoming schedule", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(
        screen.getByText("Upcoming Annadanam Schedule")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Full South Indian Meal")
      ).toBeInTheDocument();
      expect(
        screen.getByText("North Indian Thali")
      ).toBeInTheDocument();
    });

    it("shows status badges for events", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(screen.getByText("Confirmed")).toBeInTheDocument();
      expect(
        screen.getAllByText("Needs Volunteers").length
      ).toBe(2);
    });

    it("shows Volunteer to Cook and Donate Supplies buttons", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(
        screen.getAllByText("Volunteer to Cook").length
      ).toBe(3);
      expect(
        screen.getAllByText("Donate Supplies").length
      ).toBe(3);
    });

    it("hides volunteer content when annadanam tab is active", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Annadanam"));
      expect(
        screen.queryByText("Volunteer Opportunities")
      ).not.toBeInTheDocument();
    });
  });

  // Announcements Tab
  describe("Announcements tab", () => {
    it("shows announcements when tab is clicked", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Announcements"));
      expect(
        screen.getByText("Ugadi 2026 Celebration Details")
      ).toBeInTheDocument();
    });

    it("displays all announcements", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Announcements"));
      expect(
        screen.getByText("Ugadi 2026 Celebration Details")
      ).toBeInTheDocument();
      expect(
        screen.getByText("New Yoga Classes Starting April")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Temple Timing Update for Summer")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Building Fund Drive — Help Us Build the New Mandapam"
        )
      ).toBeInTheDocument();
    });

    it("shows Important badge for high-priority announcements", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Announcements"));
      expect(screen.getAllByText("Important").length).toBe(2);
    });

    it("displays announcement dates", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Announcements"));
      expect(screen.getByText("2026-03-10")).toBeInTheDocument();
      expect(screen.getByText("2026-03-08")).toBeInTheDocument();
      expect(screen.getByText("2026-03-05")).toBeInTheDocument();
      expect(screen.getByText("2026-03-01")).toBeInTheDocument();
    });

    it("displays announcement content", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Announcements"));
      expect(
        screen.getByText(/join us for a grand ugadi celebration/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/new morning yoga sessions/i)
      ).toBeInTheDocument();
    });

    it("hides volunteer and annadanam content when announcements are shown", () => {
      render(<CommunityPage />);
      fireEvent.click(screen.getByText("Announcements"));
      expect(
        screen.queryByText("Volunteer Opportunities")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Upcoming Annadanam Schedule")
      ).not.toBeInTheDocument();
    });
  });

  // Tab switching
  it("can switch between all tabs", () => {
    render(<CommunityPage />);
    // Default: Volunteer
    expect(
      screen.getByText("Volunteer Opportunities")
    ).toBeInTheDocument();

    // Switch to Annadanam
    fireEvent.click(screen.getByText("Annadanam"));
    expect(
      screen.getByText(/annadanam — community meal service/i)
    ).toBeInTheDocument();

    // Switch to Announcements
    fireEvent.click(screen.getByText("Announcements"));
    expect(
      screen.getByText("Ugadi 2026 Celebration Details")
    ).toBeInTheDocument();

    // Switch back to Volunteer
    fireEvent.click(screen.getByText("Volunteer"));
    expect(
      screen.getByText("Volunteer Opportunities")
    ).toBeInTheDocument();
  });
});
