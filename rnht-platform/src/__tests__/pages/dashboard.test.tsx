import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}));

const authState: any = {
  isAuthenticated: false,
  authUser: null,
  user: null,
  bookings: [],
  donations: [],
  activities: [],
  loading: false,
  initialized: true,
  initialize: vi.fn(),
  sendOtp: vi.fn().mockResolvedValue({}),
  verifyOtp: vi.fn().mockResolvedValue({}),
  sendPhoneOtp: vi.fn().mockResolvedValue({}),
  verifyPhoneOtp: vi.fn().mockResolvedValue({}),
  logout: vi.fn(),
  fetchUserData: vi.fn(),
};

vi.mock("@/store/auth", () => ({
  useAuthStore: (sel: any) => (typeof sel === "function" ? sel(authState) : authState),
}));

import DashboardPage from "@/app/dashboard/page";

function setSignedOut() {
  authState.isAuthenticated = false;
  authState.authUser = null;
  authState.user = null;
}

function setSignedIn() {
  authState.isAuthenticated = true;
  authState.authUser = { id: "u-1", email: "devotee@example.com" };
  authState.user = {
    id: "u-1",
    name: "Rajesh Sharma",
    email: "devotee@example.com",
    phone: "+15125550123",
    familyMembers: [],
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("Dashboard — signed-out sign-in form", () => {
  beforeEach(() => {
    setSignedOut();
    Object.values(authState).forEach((v) => {
      if (typeof v === "function" && "mockClear" in v) (v as any).mockClear();
    });
  });

  it("renders the devotee portal headline", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Devotee Portal")).toBeInTheDocument();
    expect(screen.getByText(/Create your devotee account to manage services/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create Your Devotee Account" })).toBeInTheDocument();
  });

  it("switches to sign-up mode when selected", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    expect(screen.getByRole("heading", { name: "Create Your Devotee Account" })).toBeInTheDocument();
    expect(screen.getByText(/First-time devotees can create their portal account here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account with Phone/i })).toBeInTheDocument();
  });

  it("defaults to sign-up on the Phone tab and shows a phone input", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("button", { name: "Phone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("(512) 555-0123")).toBeInTheDocument();
  });

  it("hides the name field in sign-in mode", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));
    expect(screen.queryByPlaceholderText("Enter your name")).not.toBeInTheDocument();
  });

  it("switches to the Email tab when clicked", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("(512) 555-0123")).not.toBeInTheDocument();
  });

  it("calls sendPhoneOtp with a normalized E.164 number on submit", async () => {
    render(<DashboardPage />);
    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Rajesh" },
    });
    fireEvent.change(screen.getByPlaceholderText("(512) 555-0123"), {
      target: { value: "(512) 555-0123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Account with Phone/i }));
    await waitFor(() => {
      expect(authState.sendPhoneOtp).toHaveBeenCalledWith(
        "+15125550123",
        "Rajesh"
      );
    });
  });

  it("calls sendOtp (email) on the Email tab submit", async () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Rajesh" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "rajesh@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Account with Email/i }));
    await waitFor(() => {
      expect(authState.sendOtp).toHaveBeenCalledWith(
        "rajesh@example.com",
        "Rajesh"
      );
    });
  });

  it("lets existing devotees sign in without entering a name", async () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));
    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "rajesh@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue with Email/i }));
    await waitFor(() => {
      expect(authState.sendOtp).toHaveBeenCalledWith("rajesh@example.com", "");
    });
  });

  it("shows an error on invalid phone number", async () => {
    render(<DashboardPage />);
    fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
      target: { value: "Rajesh" },
    });
    fireEvent.change(screen.getByPlaceholderText("(512) 555-0123"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Account with Phone/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid phone number/i)
      ).toBeInTheDocument();
    });
    expect(authState.sendPhoneOtp).not.toHaveBeenCalled();
  });
});

describe("Dashboard — signed-in state", () => {
  beforeEach(() => {
    setSignedIn();
  });

  it("renders without crashing for a signed-in user", () => {
    const { container } = render(<DashboardPage />);
    expect(container).toBeTruthy();
  });
});
