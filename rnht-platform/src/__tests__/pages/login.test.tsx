import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockReplace = vi.fn();
const { mockSignInWithOAuth, mockGetSession } = vi.hoisted(() => ({
  mockSignInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
  mockGetSession: vi.fn().mockResolvedValue({ data: { session: null } }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, back: vi.fn() }),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      getSession: mockGetSession,
    },
  },
}));

let authState: any;

vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => (typeof selector === "function" ? selector(authState) : authState),
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      isAuthenticated: false,
      initialize: vi.fn(),
      sendOtp: vi.fn().mockResolvedValue({}),
      sendPhoneOtp: vi.fn().mockResolvedValue({}),
      verifyPhoneOtp: vi.fn().mockResolvedValue({}),
    };
  });

  it("renders the method selection step by default", () => {
    render(<LoginPage />);
    expect(screen.getByText("Devotee Sign In / Sign Up")).toBeInTheDocument();
    expect(screen.getByText("Sign In with Email")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In.*Existing devotees/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign Up.*First-time devotees/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome Back" })).toBeInTheDocument();
    expect(authState.initialize).toHaveBeenCalled();
  });

  it("switches to sign-up mode explicitly", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up.*First-time devotees/i }));
    expect(screen.getByRole("heading", { name: "Create Your Devotee Account" })).toBeInTheDocument();
    expect(screen.getByText(/New devotees can create their portal account here/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Create Account with Email"));
    expect(screen.getByRole("button", { name: "Send Email Confirmation Link" })).toBeInTheDocument();
  });

  it("redirects authenticated users to the dashboard", () => {
    authState.isAuthenticated = true;
    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("moves to the email step and requires both name and email", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign In with Email"));
    const button = screen.getByRole("button", { name: "Send Sign-In Link" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    expect(button).not.toBeDisabled();
  });

  it("sends otp and moves to the verification step", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign In with Email"));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Sign-In Link" }));

    await waitFor(() => {
      expect(authState.sendOtp).toHaveBeenCalledWith("test@example.com", "");
    });
    expect(screen.getByText(/we sent a confirmation link to/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I Clicked the Sign-In Link" })).toBeInTheDocument();
  });

  it("shows create-account actions in sign-up mode", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /Sign Up.*First-time devotees/i }));
    fireEvent.click(screen.getByText("Create Account with Email"));
    expect(screen.getByRole("button", { name: "Send Email Confirmation Link" })).toBeDisabled();
  });

  it("shows a send otp error inline", async () => {
    authState.sendOtp.mockResolvedValue({ error: "Invalid email" });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign In with Email"));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bad@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Sign-In Link" }));

    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
  });

  it("checks for a confirmed email session and redirects", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { user: { id: "u-1" } } } });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign In with Email"));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Sign-In Link" }));

    await screen.findByText(/we sent a confirmation link to/i);
    fireEvent.click(screen.getByRole("button", { name: "I Clicked the Sign-In Link" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("starts Google sign-in", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Google"));
    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "google" })
      );
    });
  });
});
