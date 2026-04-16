/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/bookings",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { onAuthStateChange: vi.fn(), signInWithOtp: vi.fn().mockResolvedValue({ error: null }), verifyOtp: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({}), signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }), order: () => ({ data: [], limit: () => ({ data: [] }) }) }), order: () => ({ data: [] }) }), insert: () => ({ then: vi.fn() }), update: () => ({ eq: () => ({ then: vi.fn() }) }), delete: () => ({ eq: () => ({ then: vi.fn() }) }) }),
    storage: { from: () => ({ upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "https://example.com/img.jpg" } }) }) },
  },
}));
vi.mock("@/store/cart", () => ({ useCartStore: (sel: any) => { const s = { items: [], addItem: vi.fn(), removeItem: vi.fn(), updateItem: vi.fn(), clearCart: vi.fn(), getTotal: () => 0, getItemCount: () => 0 }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/language", () => ({ useLanguageStore: (sel: any) => { const s = { locale: "en", setLocale: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/auth", () => ({ useAuthStore: (sel: any) => { const s = { isAuthenticated: false, user: null, authUser: null, bookings: [], donations: [], activities: [], loading: false, initialized: true, initialize: vi.fn(), sendOtp: vi.fn().mockResolvedValue({}), verifyOtp: vi.fn().mockResolvedValue({}), logout: vi.fn(), addDonation: vi.fn(), addBooking: vi.fn(), updateProfile: vi.fn(), addFamilyMember: vi.fn(), removeFamilyMember: vi.fn(), fetchUserData: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/slideshow", () => ({ useSlideshowStore: (sel: any) => { const s = { slides: [], loading: false, fetchSlides: vi.fn(), addSlide: vi.fn(), updateSlide: vi.fn(), removeSlide: vi.fn(), reorderSlides: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));

import AdminBookingsPage from "@/app/admin/bookings/page";

describe("AdminBookingsPage", () => {
  it("renders without crashing", () => {
    render(<AdminBookingsPage />);
    expect(screen.getByText("Booking Management")).toBeInTheDocument();
  });

  it("shows back to dashboard link", () => {
    render(<AdminBookingsPage />);
    const backLink = screen.getByText("Back to Dashboard");
    expect(backLink.closest("a")).toHaveAttribute("href", "/admin");
  });

  it("shows search input", () => {
    render(<AdminBookingsPage />);
    expect(screen.getByPlaceholderText("Search by name, ID, or service...")).toBeInTheDocument();
  });

  it("shows status filter dropdown", () => {
    render(<AdminBookingsPage />);
    const select = screen.getByDisplayValue("All Status");
    expect(select).toBeInTheDocument();
  });

  it("displays all bookings in table", () => {
    render(<AdminBookingsPage />);
    expect(screen.getByText("RNHT-A1B2C")).toBeInTheDocument();
    expect(screen.getByText("RNHT-D3E4F")).toBeInTheDocument();
    expect(screen.getByText("RNHT-G5H6I")).toBeInTheDocument();
    expect(screen.getByText("RNHT-J7K8L")).toBeInTheDocument();
    expect(screen.getByText("RNHT-M9N0O")).toBeInTheDocument();
    expect(screen.getByText("RNHT-P1Q2R")).toBeInTheDocument();
  });

  it("shows table headers", () => {
    render(<AdminBookingsPage />);
    expect(screen.getByText("Booking ID")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("shows View buttons for each booking", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    expect(viewButtons.length).toBe(6);
  });

  it("opens booking detail modal when clicking View", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);
    expect(screen.getByText("Booking Details")).toBeInTheDocument();
    // Booking ID appears in both the table and the modal
    const bookingIds = screen.getAllByText("RNHT-A1B2C");
    expect(bookingIds.length).toBeGreaterThanOrEqual(2);
    // "Ramesh Kumar" appears in both the table and the modal
    const names = screen.getAllByText("Ramesh Kumar");
    expect(names.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("ramesh@email.com")).toBeInTheDocument();
    expect(screen.getByText("Bharadwaja")).toBeInTheDocument();
  });

  it("shows confirm button for confirmed bookings in modal", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]); // First booking is confirmed
    expect(screen.getByText("Mark Completed")).toBeInTheDocument();
  });

  it("shows confirm button for pending bookings in modal", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[3]); // RNHT-J7K8L is pending
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("closes modal when clicking Close", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);
    expect(screen.getByText("Booking Details")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByText("Booking Details")).not.toBeInTheDocument();
  });

  it("closes modal when clicking x button", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);
    fireEvent.click(screen.getByText("×"));
    expect(screen.queryByText("Booking Details")).not.toBeInTheDocument();
  });

  it("filters bookings by search query", () => {
    render(<AdminBookingsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search by name, ID, or service..."), {
      target: { value: "Ramesh" },
    });
    expect(screen.getByText("RNHT-A1B2C")).toBeInTheDocument();
    expect(screen.queryByText("RNHT-D3E4F")).not.toBeInTheDocument();
  });

  it("filters bookings by status", () => {
    render(<AdminBookingsPage />);
    fireEvent.change(screen.getByDisplayValue("All Status"), {
      target: { value: "pending" },
    });
    expect(screen.getByText("RNHT-J7K8L")).toBeInTheDocument();
    expect(screen.queryByText("RNHT-A1B2C")).not.toBeInTheDocument();
  });

  it("shows cancel button in modal for non-completed/cancelled bookings", () => {
    render(<AdminBookingsPage />);
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]); // confirmed booking
    // "Cancel" button should be present inside the modal
    const cancelButtons = screen.getAllByText("Cancel");
    expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
  });
});
