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

// Controllable language-store mock: `langState.locale` is what the Preferences
// "Preferred Language" select must reflect, and `setLocaleSpy` proves the select
// dispatches changes back to the store.
const { langState, setLocaleSpy } = vi.hoisted(() => ({
  langState: { locale: "en" },
  setLocaleSpy: vi.fn(),
}));
vi.mock("@/store/language", () => ({
  useLanguageStore: () => ({ locale: langState.locale, setLocale: setLocaleSpy }),
}));

import ProfilePage from "@/app/profile/page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    langState.locale = "en";
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

  it("Preferences: language select reflects the store locale and dispatches changes", () => {
    langState.locale = "hi"; // store says Hindi
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Preferences"));
    const select = screen.getByLabelText("Preferred Language") as HTMLSelectElement;
    // Bound to the store value (not a hardcoded "English"), and uses locale codes.
    expect(select.value).toBe("hi");
    fireEvent.change(select, { target: { value: "te" } });
    expect(setLocaleSpy).toHaveBeenCalledWith("te");
  });

  it("Preferences: notification + dietary choices persist to localStorage", async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Preferences"));

    const push = screen.getByRole("checkbox", { name: /Push Notifications/ }) as HTMLInputElement;
    expect(push.checked).toBe(true); // default-on
    fireEvent.click(push); // turn off

    const dietary = screen.getByLabelText("Dietary Restrictions (for Prasadam)") as HTMLSelectElement;
    fireEvent.change(dietary, { target: { value: "Vegan" } });

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("rnht-member-preferences") || "{}");
      expect(saved.notifications.push).toBe(false);
      expect(saved.notifications.email).toBe(true);
      expect(saved.dietary).toBe("Vegan");
    });
  });

  it("Preferences: saved preferences rehydrate on next mount", async () => {
    localStorage.setItem(
      "rnht-member-preferences",
      JSON.stringify({ notifications: { push: false, email: true, sms: true, whatsapp: true }, deities: ["Lord Shiva"], dietary: "No Nuts" })
    );
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Preferences"));
    await waitFor(() => {
      expect((screen.getByRole("checkbox", { name: /Push Notifications/ }) as HTMLInputElement).checked).toBe(false);
    });
    expect((screen.getByRole("checkbox", { name: /Lord Shiva/ }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Dietary Restrictions (for Prasadam)") as HTMLSelectElement).value).toBe("No Nuts");
  });
});
