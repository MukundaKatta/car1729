import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockReplace = vi.fn();
const { mockSignInWithOAuth } = vi.hoisted(() => ({
  mockSignInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
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
      verifyOtp: vi.fn().mockResolvedValue({}),
    };
  });

  it("renders the method selection step by default", () => {
    render(<LoginPage />);
    expect(screen.getByText("Devotee Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign in with Email")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(authState.initialize).toHaveBeenCalled();
  });

  it("redirects authenticated users to the dashboard", () => {
    authState.isAuthenticated = true;
    render(<LoginPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("moves to the email step and requires both name and email", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign in with Email"));
    const button = screen.getByRole("button", { name: "Send Verification Code" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Enter your name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    expect(button).not.toBeDisabled();
  });

  it("sends otp and moves to the verification step", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign in with Email"));
    fireEvent.change(screen.getByPlaceholderText("Enter your name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Verification Code" }));

    await waitFor(() => {
      expect(authState.sendOtp).toHaveBeenCalledWith("test@example.com", "Test User");
    });
    expect(screen.getByText(/enter the 6-digit code sent to/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify & Sign In" })).toBeDisabled();
  });

  it("shows a send otp error inline", async () => {
    authState.sendOtp.mockResolvedValue({ error: "Invalid email" });
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign in with Email"));
    fireEvent.change(screen.getByPlaceholderText("Enter your name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "bad@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Verification Code" }));

    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
  });

  it("verifies otp and shows the success step", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Sign in with Email"));
    fireEvent.change(screen.getByPlaceholderText("Enter your name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Verification Code" }));

    await screen.findByText(/enter the 6-digit code sent to/i);
    for (let i = 0; i < 6; i += 1) {
      fireEvent.change(document.getElementById(`otp-${i}`)!, { target: { value: String(i + 1) } });
    }

    fireEvent.click(screen.getByRole("button", { name: "Verify & Sign In" }));

    await waitFor(() => {
      expect(authState.verifyOtp).toHaveBeenCalledWith("test@example.com", "123456");
    });
    expect(screen.getByText("Welcome to RNHT!")).toBeInTheDocument();
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
