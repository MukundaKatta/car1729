/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const sampleRows = [
  {
    id: "RNHT-A1B2C",
    devotee_name: "Ramesh Kumar",
    devotee_email: "ramesh@email.com",
    devotee_phone: "(555) 111-2222",
    booking_date: "2026-03-15",
    booking_time: "10:00 AM",
    status: "confirmed",
    total_amount: 101,
    gotra: "Bharadwaja",
    nakshatra: "Ashwini",
    services: { name: "Ganapathi Homam" },
  },
  {
    id: "RNHT-D3E4F",
    devotee_name: "Lakshmi Devi",
    devotee_email: "lakshmi@email.com",
    devotee_phone: "(555) 333-4444",
    booking_date: "2026-03-14",
    booking_time: "11:00 AM",
    status: "confirmed",
    total_amount: 51,
    gotra: "Kashyapa",
    nakshatra: "Rohini",
    services: { name: "Abhishekam" },
  },
  {
    id: "RNHT-G5H6I",
    devotee_name: "Suresh Patel",
    devotee_email: "suresh@email.com",
    devotee_phone: "(555) 555-6666",
    booking_date: "2026-03-13",
    booking_time: "9:00 AM",
    status: "completed",
    total_amount: 11,
    gotra: "Vasishtha",
    nakshatra: "Pushya",
    services: { name: "Archana" },
  },
  {
    id: "RNHT-J7K8L",
    devotee_name: "Priya Sharma",
    devotee_email: "priya@email.com",
    devotee_phone: "(555) 777-8888",
    booking_date: "2026-03-16",
    booking_time: "9:00 AM",
    status: "pending",
    total_amount: 351,
    gotra: "Atri",
    nakshatra: "Uttara",
    services: { name: "Gruhapravesam (Standard)" },
  },
  {
    id: "RNHT-M9N0O",
    devotee_name: "Venkat Rao",
    devotee_email: "venkat@email.com",
    devotee_phone: "(555) 999-0000",
    booking_date: "2026-03-12",
    booking_time: "10:00 AM",
    status: "completed",
    total_amount: 51,
    gotra: "Gautama",
    nakshatra: "Swati",
    services: { name: "Satyanarayana Vratam" },
  },
  {
    id: "RNHT-P1Q2R",
    devotee_name: "Anitha Reddy",
    devotee_email: "anitha@email.com",
    devotee_phone: "(555) 123-4567",
    booking_date: "2026-03-17",
    booking_time: "9:00 AM",
    status: "confirmed",
    total_amount: 151,
    gotra: "Jamadagni",
    nakshatra: "Moola",
    services: { name: "Navagraha Homam" },
  },
];

const updateEq = vi.fn().mockResolvedValue({ error: null });
const updateFn = vi.fn(() => ({ eq: updateEq }));
const orderFn = vi.fn().mockResolvedValue({ data: sampleRows, error: null });

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/bookings",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: orderFn }),
      update: updateFn,
    }),
  },
}));

import AdminBookingsPage from "@/app/admin/bookings/page";

beforeEach(() => {
  updateEq.mockClear();
  updateFn.mockClear();
  orderFn.mockClear();
  orderFn.mockResolvedValue({ data: sampleRows, error: null });
});

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

  it("loads and displays bookings from the DB", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getByText("RNHT-A1B2C")).toBeInTheDocument());
    expect(screen.getByText("RNHT-D3E4F")).toBeInTheDocument();
    expect(screen.getByText("RNHT-G5H6I")).toBeInTheDocument();
    expect(screen.getByText("RNHT-J7K8L")).toBeInTheDocument();
    expect(screen.getByText("RNHT-M9N0O")).toBeInTheDocument();
    expect(screen.getByText("RNHT-P1Q2R")).toBeInTheDocument();
    // service name from the joined services relation
    expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
  });

  it("shows table headers", () => {
    render(<AdminBookingsPage />);
    expect(screen.getByText("Booking ID")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("shows an empty state when there are no bookings", async () => {
    orderFn.mockResolvedValueOnce({ data: [], error: null });
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getByText("No bookings found.")).toBeInTheDocument());
  });

  it("shows an error message when the DB query fails", async () => {
    orderFn.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
  });

  it("shows View buttons for each booking", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
  });

  it("opens booking detail modal when clicking View", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
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

  it("shows mark completed button for confirmed bookings in modal", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]); // First booking is confirmed
    expect(screen.getByText("Mark Completed")).toBeInTheDocument();
  });

  it("shows confirm button for pending bookings in modal", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[3]); // RNHT-J7K8L is pending
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("persists status updates via supabase", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[3]); // RNHT-J7K8L is pending
    fireEvent.click(screen.getByText("Confirm"));
    await waitFor(() => {
      expect(updateFn).toHaveBeenCalledWith({ status: "confirmed" });
      expect(updateEq).toHaveBeenCalledWith("id", "RNHT-J7K8L");
    });
  });

  it("closes modal when clicking Close", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);
    expect(screen.getByText("Booking Details")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByText("Booking Details")).not.toBeInTheDocument();
  });

  it("closes modal when clicking x button", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);
    fireEvent.click(screen.getByText("×"));
    expect(screen.queryByText("Booking Details")).not.toBeInTheDocument();
  });

  it("filters bookings by search query", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getByText("RNHT-A1B2C")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("Search by name, ID, or service..."), {
      target: { value: "Ramesh" },
    });
    expect(screen.getByText("RNHT-A1B2C")).toBeInTheDocument();
    expect(screen.queryByText("RNHT-D3E4F")).not.toBeInTheDocument();
  });

  it("filters bookings by status", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getByText("RNHT-A1B2C")).toBeInTheDocument());
    fireEvent.change(screen.getByDisplayValue("All Status"), {
      target: { value: "pending" },
    });
    expect(screen.getByText("RNHT-J7K8L")).toBeInTheDocument();
    expect(screen.queryByText("RNHT-A1B2C")).not.toBeInTheDocument();
  });

  it("shows cancel button in modal for non-completed/cancelled bookings", async () => {
    render(<AdminBookingsPage />);
    await waitFor(() => expect(screen.getAllByText("View").length).toBe(6));
    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]); // confirmed booking
    // "Cancel" button should be present inside the modal
    const cancelButtons = screen.getAllByText("Cancel");
    expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
  });
});
