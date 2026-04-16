import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

let authState: any;

vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => (typeof selector === "function" ? selector(authState) : authState),
}));

import ProfilePage from "@/app/profile/page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    authState = {
      isAuthenticated: true,
      initialized: true,
      initialize: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      updateProfile: vi.fn().mockResolvedValue(undefined),
      user: {
        id: "user-1",
        name: "Rajesh Sharma",
        email: "rajesh.sharma@email.com",
        phone: "+1 (555) 123-4567",
        address: "123 Desert View Dr, Las Vegas, NV 89101",
        gotra: "Bharadwaja",
        nakshatra: "Pushya",
        rashi: "Karka (Cancer)",
        familyMembers: [
          { id: "fm-1", name: "Priya Sharma", relationship: "Spouse", gotra: "Bharadwaja", nakshatra: "Revati" },
          { id: "fm-2", name: "Aarav Sharma", relationship: "Son", gotra: "Bharadwaja", nakshatra: "Ashwini" },
        ],
      },
      bookings: [
        {
          id: "BKG-1",
          serviceName: "Ganapathi Homam",
          serviceEmoji: "🙏",
          date: "2026-04-20",
          time: "10:00 AM",
          status: "confirmed",
          amount: 151,
          priest: "Pt. Aditya Sharma",
          location: "Temple",
          createdAt: "",
        },
        {
          id: "BKG-2",
          serviceName: "Archana",
          serviceEmoji: "🙏",
          date: "2026-03-01",
          time: "9:00 AM",
          status: "completed",
          amount: 21,
          priest: "Pt. Raghurama Sharma",
          location: "Temple",
          createdAt: "",
        },
      ],
      donations: [
        { id: "DON-1", fund: "General Temple Fund", amount: 101, date: "2026-01-10", method: "Card", recurring: false, receiptId: "REC-1", taxDeductible: true },
        { id: "DON-2", fund: "Annadanam Fund", amount: 251, date: "2026-02-12", method: "Zelle", recurring: true, receiptId: "REC-2", taxDeductible: true, frequency: "monthly" },
      ],
    };
  });

  it("renders the devotee header and stats", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByText(/rajesh\.sharma@email\.com/)).toBeInTheDocument();
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();
    expect(screen.getByText("Family Members")).toBeInTheDocument();
  });

  it("shows the profile form by default", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bharadwaja")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Karka (Cancer)")).toBeInTheDocument();
  });

  it("saves profile updates", async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByDisplayValue("Rajesh Sharma"), { target: { value: "Rajesh S." } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(authState.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Rajesh S." })
      );
    });
    expect(window.alert).toHaveBeenCalledWith("Profile saved successfully!");
  });

  it("opens the family tab and shows members", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Family"));
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("Aarav Sharma")).toBeInTheDocument();
    expect(screen.getByText("Family Spiritual Dashboard")).toBeInTheDocument();
  });

  it("adds a family member from the modal", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Family"));
    fireEvent.click(screen.getByText("Add Member"));
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Meera Sharma" } });
    fireEvent.change(screen.getByLabelText("Relationship"), { target: { value: "Daughter" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add Member" })[1]);
    expect(screen.getByText("Meera Sharma")).toBeInTheDocument();
  });

  it("shows booking actions in the bookings tab", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Bookings"));
    expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
    expect(screen.getByText("Reschedule")).toBeInTheDocument();
    expect(screen.getByText("Rebook this service")).toBeInTheDocument();
  });

  it("shows donations and recurring badges", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Donations"));
    expect(screen.getByText("General Temple Fund")).toBeInTheDocument();
    expect(screen.getByText("Annadanam Fund")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Tax Summary")).toBeInTheDocument();
  });

  it("shows the preferences sections", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Preferences"));
    expect(screen.getByText("Preferred Language")).toBeInTheDocument();
    expect(screen.getByText("Communication Preferences")).toBeInTheDocument();
    expect(screen.getByText("Spiritual Preferences")).toBeInTheDocument();
    expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
  });

  it("signs out and redirects to login", async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Sign Out"));
    await waitFor(() => {
      expect(authState.logout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects unauthenticated users after initialization", () => {
    authState.isAuthenticated = false;
    render(<ProfilePage />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
