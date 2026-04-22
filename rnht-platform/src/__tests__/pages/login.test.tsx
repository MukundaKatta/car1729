import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

const { mockSignInWithOAuth } = vi.hoisted(() => ({
  mockSignInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOAuth: mockSignInWithOAuth,
    },
  },
}));

let mockAuthState: any;

vi.mock("@/store/auth", () => ({
  useAuthStore: () => mockAuthState,
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      isAuthenticated: false,
      initialize: vi.fn(),
      sendOtp: vi.fn().mockResolvedValue({}),
      verifyOtp: vi.fn().mockResolvedValue({}),
      sendPhoneOtp: vi.fn().mockResolvedValue({}),
      verifyPhoneOtp: vi.fn().mockResolvedValue({}),
    };
  });

  describe("method step", () => {
    it("renders the page heading and welcome copy", () => {
      render(<LoginPage />);
      expect(screen.getByText("Devotee Sign In")).toBeInTheDocument();
      expect(screen.getByText(/Access your devotee profile/i)).toBeInTheDocument();
    });

    it("shows BOTH sign-in options (phone and email)", () => {
      render(<LoginPage />);
      expect(screen.getByText("Sign in with Phone")).toBeInTheDocument();
      expect(screen.getByText("Email with 6-digit code")).toBeInTheDocument();
    });

    it("shows a Google OAuth option", () => {
      render(<LoginPage />);
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });

    it("calls signInWithOAuth when Continue with Google is clicked", () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Continue with Google"));
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "google" })
      );
    });
  });

  describe("email flow", () => {
    it("advances to the email step when Sign in with Email is clicked", () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Email with 6-digit code"));
      expect(screen.getByText("Your Name")).toBeInTheDocument();
      expect(screen.getByText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("Send Verification Code")).toBeInTheDocument();
    });

    it("enables Send Verification Code when both name + email are filled", () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Email with 6-digit code"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "Rajesh" },
      });
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "rajesh@example.com" },
      });
      expect(screen.getByText("Send Verification Code")).not.toBeDisabled();
    });

    it("calls sendOtp and moves to the OTP step on success", async () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Email with 6-digit code"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "Rajesh" },
      });
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "rajesh@example.com" },
      });
      fireEvent.click(screen.getByText("Send Verification Code"));
      await waitFor(() => {
        expect(mockAuthState.sendOtp).toHaveBeenCalledWith(
          "rajesh@example.com",
          "Rajesh"
        );
      });
      expect(
        screen.getByText(/Enter the 6-digit code sent to/)
      ).toBeInTheDocument();
    });

    it("displays an error when sendOtp returns an error", async () => {
      mockAuthState.sendOtp = vi.fn().mockResolvedValue({ error: "Bad email" });
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Email with 6-digit code"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "Rajesh" },
      });
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "x@y.com" },
      });
      fireEvent.click(screen.getByText("Send Verification Code"));
      await waitFor(() => {
        expect(screen.getByText("Bad email")).toBeInTheDocument();
      });
    });
  });

  describe("phone flow", () => {
    it("advances to the phone step when Sign in with Phone is clicked", () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Sign in with Phone"));
      expect(screen.getByText("Phone Number")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("(512) 555-0123")).toBeInTheDocument();
    });

    it("normalizes a US phone to E.164 and calls sendPhoneOtp", async () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Sign in with Phone"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "Rajesh" },
      });
      fireEvent.change(screen.getByPlaceholderText("(512) 555-0123"), {
        target: { value: "(512) 555-0123" },
      });
      fireEvent.click(screen.getByText("Send Verification Code"));
      await waitFor(() => {
        expect(mockAuthState.sendPhoneOtp).toHaveBeenCalledWith(
          "+15125550123",
          "Rajesh"
        );
      });
      // OTP step shows the normalized number
      expect(screen.getByText("+15125550123")).toBeInTheDocument();
    });

    it("shows an error for an obviously invalid phone number", async () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Sign in with Phone"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "Rajesh" },
      });
      fireEvent.change(screen.getByPlaceholderText("(512) 555-0123"), {
        target: { value: "abc" },
      });
      fireEvent.click(screen.getByText("Send Verification Code"));
      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a valid phone number/)
        ).toBeInTheDocument();
      });
      expect(mockAuthState.sendPhoneOtp).not.toHaveBeenCalled();
    });
  });

  describe("OTP step shared behavior", () => {
    it("shows the verification-code input and Verify & Sign In button", async () => {
      render(<LoginPage />);
      fireEvent.click(screen.getByText("Email with 6-digit code"));
      fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
        target: { value: "Rajesh" },
      });
      fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "r@x.com" },
      });
      fireEvent.click(screen.getByText("Send Verification Code"));
      await waitFor(() => {
        expect(
          screen.getByText(/Enter the 6-digit code sent to/)
        ).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
      expect(screen.getByText("Verify & Sign In")).toBeInTheDocument();
    });
  });
});
