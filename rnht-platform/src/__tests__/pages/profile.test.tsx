import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let authState: any;

vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => (typeof selector === "function" ? selector(authState) : authState),
}));

import ProfilePage from "@/app/profile/page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      isAuthenticated: true,
      initialized: true,
      initialize: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      updateProfile: vi.fn().mockResolvedValue({}),
      addFamilyMember: vi.fn(),
      removeFamilyMember: vi.fn(),
      user: {
        id: "user-1",
        name: "Rajesh Sharma",
        email: "rajesh.sharma@email.com",
        phone: "+1 (555) 123-4567",
        address: "123 Desert View Dr",
        gotra: "Bharadwaja",
        nakshatra: "Pushya",
        rashi: "Karka (Cancer)",
        familyMembers: [
          { id: "fm-1", name: "Priya Sharma", relationship: "Spouse", gotra: "Bharadwaja", nakshatra: "Revati", rashi: "", dob: "" },
        ],
      },
      bookings: [
        { id: "b1", serviceName: "Ganapathi Homam", date: "2026-04-20", time: "10:00 AM", status: "confirmed", amount: 151, priest: "Pt. Aditya", location: "Temple" },
      ],
      donations: [
        { id: "d1", fund: "General Temple Fund", amount: 101, date: "2026-01-10", method: "Card", recurring: false },
      ],
    };
  });

  it("renders the devotee profile and stats", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();
    expect(screen.getByText("Family Members")).toBeInTheDocument();
  });

  it("saves profile updates and shows success", async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByDisplayValue("Rajesh Sharma"), { target: { value: "Rajesh S." } });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(authState.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ name: "Rajesh S." }));
    });
    expect(screen.getByText("Profile saved successfully!")).toBeInTheDocument();
  });

  it("adds a family member via the store action", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Family"));
    fireEvent.click(screen.getByText("Add Member"));
    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Meera Sharma" } });
    fireEvent.change(screen.getByLabelText("Relationship"), { target: { value: "Daughter" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add Member" })[1]);
    expect(authState.addFamilyMember).toHaveBeenCalledWith(expect.objectContaining({ name: "Meera Sharma" }));
  });

  it("shows bookings and donations tabs", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Bookings"));
    expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Donations"));
    expect(screen.getByText("General Temple Fund")).toBeInTheDocument();
  });

  it("signs out and redirects to login", async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Sign Out"));
    await waitFor(() => {
      expect(authState.logout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
