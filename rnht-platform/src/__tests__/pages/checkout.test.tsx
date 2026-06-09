import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();
const mockClearCart = vi.fn();
let searchParamsState = new URLSearchParams();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/checkout",
  useSearchParams: () => searchParamsState,
}));

let cartState: any;

vi.mock("@/store/cart", () => ({
  useCartStore: (selector?: any) => (typeof selector === "function" ? selector(cartState) : cartState),
}));

import CheckoutPage from "@/app/checkout/page";

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsState = new URLSearchParams();
    cartState = {
      items: [
        {
          id: "cart-1",
          service: { id: "svc-1", name: "Ganapathi Pooja", price: 51, suggested_donation: null },
          selectedTier: null,
          quantity: 1,
          bookingDate: "2026-04-01",
          bookingTime: "10:00 AM",
        },
      ],
      getTotal: () => 51,
      clearCart: mockClearCart,
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects empty carts back to /services", () => {
    cartState = { items: [], getTotal: () => 0, clearCart: mockClearCart };
    render(<CheckoutPage />);
    expect(mockPush).toHaveBeenCalledWith("/services");
  });

  it("renders the summary and payment methods", () => {
    render(<CheckoutPage />);
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();
    expect(screen.getByText("Credit / Debit Card")).toBeInTheDocument();
    expect(screen.getByText("Zelle")).toBeInTheDocument();
  });

  it("shows zelle instructions when selected", () => {
    render(<CheckoutPage />);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(screen.getByText("Zelle Payment Instructions:")).toBeInTheDocument();
    expect(screen.getByText("Complete Booking")).toBeInTheDocument();
  });

  it("shows the fetch error message for stripe failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    render(<CheckoutPage />);
    fireEvent.click(screen.getByText(/Pay \$51\.00/i));
    expect(
      await screen.findByText(/Online payment is currently unavailable/i)
    ).toBeInTheDocument();
  });

  it("does not trust success without a session id", async () => {
    searchParamsState = new URLSearchParams("success=true");
    render(<CheckoutPage />);

    expect(
      await screen.findByText("Payment Verification Needed")
    ).toBeInTheDocument();
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it("verifies Stripe success before confirming the order", async () => {
    searchParamsState = new URLSearchParams("success=true&session_id=cs_test_123");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ verified: true, orderId: "RNHT-ABC12345" }), {
        status: 200,
      })
    );

    render(<CheckoutPage />);

    expect(
      await screen.findByText(/Booking Confirmed!/i)
    ).toBeInTheDocument();
    expect(screen.getByText("RNHT-ABC12345")).toBeInTheDocument();
    expect(mockClearCart).toHaveBeenCalled();
  });
});
