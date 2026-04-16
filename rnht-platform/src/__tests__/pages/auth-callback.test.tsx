/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const { mockReplace, mockOnAuthStateChange } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockOnAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
}));

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/auth/callback",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args), getSession: vi.fn().mockResolvedValue({ data: { session: null } }), signInWithOtp: vi.fn().mockResolvedValue({ error: null }), verifyOtp: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({}), signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }), order: () => ({ data: [], limit: () => ({ data: [] }) }) }), order: () => ({ data: [] }) }), insert: () => ({ then: vi.fn() }), update: () => ({ eq: () => ({ then: vi.fn() }) }), delete: () => ({ eq: () => ({ then: vi.fn() }) }) }),
    storage: { from: () => ({ upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "https://example.com/img.jpg" } }) }) },
  },
}));
vi.mock("@/store/cart", () => ({ useCartStore: (sel: any) => { const s = { items: [], addItem: vi.fn(), removeItem: vi.fn(), updateItem: vi.fn(), clearCart: vi.fn(), getTotal: () => 0, getItemCount: () => 0 }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/language", () => ({ useLanguageStore: (sel: any) => { const s = { locale: "en", setLocale: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/auth", () => ({ useAuthStore: (sel: any) => { const s = { isAuthenticated: false, user: null, authUser: null, bookings: [], donations: [], activities: [], loading: false, initialized: true, initialize: vi.fn(), sendOtp: vi.fn().mockResolvedValue({}), verifyOtp: vi.fn().mockResolvedValue({}), logout: vi.fn(), addDonation: vi.fn(), addBooking: vi.fn(), updateProfile: vi.fn(), addFamilyMember: vi.fn(), removeFamilyMember: vi.fn(), fetchUserData: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/slideshow", () => ({ useSlideshowStore: (sel: any) => { const s = { slides: [], loading: false, fetchSlides: vi.fn(), addSlide: vi.fn(), updateSlide: vi.fn(), removeSlide: vi.fn(), reorderSlides: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));

import AuthCallbackPage from "@/app/auth/callback/page";

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockReplace.mockReset();
    mockOnAuthStateChange.mockReset().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing", () => {
    render(<AuthCallbackPage />);
    expect(screen.getByText("Signing you in...")).toBeInTheDocument();
  });

  it("shows a loading spinner", () => {
    const { container } = render(<AuthCallbackPage />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("calls onAuthStateChange on mount", () => {
    render(<AuthCallbackPage />);
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it("shows error state when session not found after timeout", async () => {
    render(<AuthCallbackPage />);
    vi.advanceTimersByTime(5000);
    // Wait for the async getSession to resolve
    await vi.waitFor(() => {
      expect(screen.getByText("Sign In Failed")).toBeInTheDocument();
    });
  });

  it("redirects to dashboard on SIGNED_IN event", () => {
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      callback("SIGNED_IN", null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    render(<AuthCallbackPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
