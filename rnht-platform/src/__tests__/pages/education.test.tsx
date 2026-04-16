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

import EducationPage from "@/app/education/page";

describe("EducationPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders without crashing", () => {
    render(<EducationPage />);
    expect(
      screen.getByRole("heading", { name: /education & classes/i })
    ).toBeInTheDocument();
  });

  it("displays the page description", () => {
    render(<EducationPage />);
    expect(
      screen.getByText(/deepen your spiritual knowledge/i)
    ).toBeInTheDocument();
  });

  // Category filters
  it("renders all category filter buttons", () => {
    render(<EducationPage />);
    expect(screen.getByText(/All Programs \(10\)/)).toBeInTheDocument();
    expect(screen.getByText(/Vedic School \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Children's Programs \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Cultural Classes \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Yoga & Wellness \(2\)/)).toBeInTheDocument();
  });

  // Programs display
  it("shows all 10 programs by default", () => {
    render(<EducationPage />);
    expect(
      screen.getByText("Vedic Chanting (Sri Rudram)")
    ).toBeInTheDocument();
    expect(screen.getByText("Sanskrit for Beginners")).toBeInTheDocument();
    expect(
      screen.getByText("Bhagavad Gita Study Circle")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bala Vihar (Children's Sunday School)")
    ).toBeInTheDocument();
    expect(screen.getByText("Shloka Learning for Kids")).toBeInTheDocument();
    expect(screen.getByText("Bharatanatyam Dance")).toBeInTheDocument();
    expect(screen.getByText("Carnatic Music Vocal")).toBeInTheDocument();
    expect(screen.getByText("Telugu Language Class")).toBeInTheDocument();
    expect(screen.getByText("Yoga & Pranayama")).toBeInTheDocument();
    expect(
      screen.getByText("Meditation & Mindfulness")
    ).toBeInTheDocument();
  });

  it("displays program details like schedule and location", () => {
    render(<EducationPage />);
    expect(
      screen.getByText("Saturdays, 10:00 AM - 11:30 AM")
    ).toBeInTheDocument();
    // "RNHT Prayer Hall" appears for multiple programs
    const locations = screen.getAllByText("RNHT Prayer Hall");
    expect(locations.length).toBeGreaterThanOrEqual(1);
  });

  it("displays fee labels", () => {
    render(<EducationPage />);
    expect(screen.getByText("$50 / semester")).toBeInTheDocument();
    expect(
      screen.getAllByText("Free (Donations welcome)").length
    ).toBeGreaterThan(0);
  });

  it("displays enrollment info and spots remaining", () => {
    render(<EducationPage />);
    // "6 spots remaining" may appear for multiple programs with the same capacity
    const spots = screen.getAllByText("6 spots remaining");
    expect(spots.length).toBeGreaterThanOrEqual(1);
  });

  // Filtering by category
  it("filters to show only Vedic School programs", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getByText(/Vedic School \(3\)/));
    expect(
      screen.getByText("Vedic Chanting (Sri Rudram)")
    ).toBeInTheDocument();
    expect(screen.getByText("Sanskrit for Beginners")).toBeInTheDocument();
    expect(
      screen.getByText("Bhagavad Gita Study Circle")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Bharatanatyam Dance")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Yoga & Pranayama")
    ).not.toBeInTheDocument();
  });

  it("filters to show only Children's Programs", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getByText(/Children's Programs \(2\)/));
    expect(
      screen.getByText("Bala Vihar (Children's Sunday School)")
    ).toBeInTheDocument();
    expect(screen.getByText("Shloka Learning for Kids")).toBeInTheDocument();
    expect(
      screen.queryByText("Sanskrit for Beginners")
    ).not.toBeInTheDocument();
  });

  it("filters to show only Cultural Classes", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getByText(/Cultural Classes \(3\)/));
    expect(screen.getByText("Bharatanatyam Dance")).toBeInTheDocument();
    expect(screen.getByText("Carnatic Music Vocal")).toBeInTheDocument();
    expect(screen.getByText("Telugu Language Class")).toBeInTheDocument();
    expect(
      screen.queryByText("Yoga & Pranayama")
    ).not.toBeInTheDocument();
  });

  it("filters to show only Yoga & Wellness programs", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getByText(/Yoga & Wellness \(2\)/));
    expect(screen.getByText("Yoga & Pranayama")).toBeInTheDocument();
    expect(
      screen.getByText("Meditation & Mindfulness")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Bharatanatyam Dance")
    ).not.toBeInTheDocument();
  });

  it("shows all programs again when All Programs is clicked", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getByText(/Vedic School \(3\)/));
    expect(
      screen.queryByText("Bharatanatyam Dance")
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/All Programs \(10\)/));
    expect(screen.getByText("Bharatanatyam Dance")).toBeInTheDocument();
  });

  // Registration modal
  it("opens registration modal when Register Now is clicked", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    expect(
      screen.getByText(/Register: Vedic Chanting \(Sri Rudram\)/)
    ).toBeInTheDocument();
  });

  it("displays program details in modal", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    expect(
      screen.getByText(/Pandit Venkata Sharma/)
    ).toBeInTheDocument();
    expect(screen.getByText(/12 weeks/)).toBeInTheDocument();
  });

  it("displays topics in modal", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    expect(
      screen.getByText("Pronunciation & Swaras")
    ).toBeInTheDocument();
    expect(screen.getByText("Rudra Prashna")).toBeInTheDocument();
    expect(screen.getByText("Chamaka Prashna")).toBeInTheDocument();
    expect(screen.getByText("Meditative Chanting")).toBeInTheDocument();
  });

  it("displays student information form fields in modal", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    expect(
      screen.getByPlaceholderText("Student Full Name *")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Parent/Guardian Name (for children)"
      )
    ).toBeInTheDocument();
  });

  it("shows paid registration button for paid programs", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    expect(
      screen.getByText(/Register & Pay \$50 \/ semester/)
    ).toBeInTheDocument();
  });

  it("shows free registration button for free programs", () => {
    render(<EducationPage />);
    // Bhagavad Gita Study Circle is free (index 2)
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[2]);
    expect(screen.getByText("Register (Free)")).toBeInTheDocument();
  });

  it("closes modal when Cancel is clicked", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    expect(
      screen.getByText(/Register: Vedic Chanting/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.queryByText(/Register: Vedic Chanting/)
    ).not.toBeInTheDocument();
  });

  it("submits registration and shows alert", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    fireEvent.change(screen.getByPlaceholderText("Student Full Name *"), { target: { value: "Student Name" } });
    fireEvent.change(screen.getByPlaceholderText("Email *"), { target: { value: "student@example.com" } });
    fireEvent.click(screen.getByText(/Register & Pay/));
    expect(window.alert).toHaveBeenCalledWith(
      "Registration submitted! You will receive a confirmation email shortly."
    );
  });

  it("closes modal after registration submission", () => {
    render(<EducationPage />);
    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);
    fireEvent.change(screen.getByPlaceholderText("Student Full Name *"), { target: { value: "Student Name" } });
    fireEvent.change(screen.getByPlaceholderText("Email *"), { target: { value: "student@example.com" } });
    fireEvent.click(screen.getByText(/Register & Pay/));
    expect(
      screen.queryByText(/Register: Vedic Chanting/)
    ).not.toBeInTheDocument();
  });

  // Category badges
  it("displays correct category badge text", () => {
    render(<EducationPage />);
    expect(screen.getAllByText("Vedic School").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Children's Program").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Cultural Class").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wellness").length).toBeGreaterThan(0);
  });
});
