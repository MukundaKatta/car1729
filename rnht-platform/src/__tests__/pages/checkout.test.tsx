import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockPush = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null }),
          order: () => ({ data: [], limit: () => ({ data: [] }) }),
        }),
        order: () => ({ data: [] }),
      }),
      insert: () => ({ then: vi.fn() }),
      update: () => ({ eq: () => ({ then: vi.fn() }) }),
      delete: () => ({ eq: () => ({ then: vi.fn() }) }),
    }),
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/img.jpg" },
        }),
      }),
    },
  },
}));

vi.mock("@/store/language", () => ({
  useLanguageStore: (selector: any) => {
    const state = { locale: "en", setLocale: vi.fn() };
    return typeof selector === "function" ? selector(state) : state;
  },
}));
vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => {
    const state = {
      isAuthenticated: false,
      user: null,
      authUser: null,
      bookings: [],
      donations: [],
      activities: [],
      initialize: vi.fn(),
      sendOtp: vi.fn(),
      verifyOtp: vi.fn(),
      logout: vi.fn(),
      addDonation: vi.fn(),
      addBooking: vi.fn(),
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

const mockClearCart = vi.fn();

const sampleCartItem = {
  id: "cart-1",
  service: {
    id: "svc-1",
    name: "Ganapathi Pooja",
    price: 51,
    suggested_donation: null,
    category_id: "cat-2",
    slug: "ganapathi-pooja",
    short_description: "Sacred worship",
    full_description: "",
    significance: "",
    items_to_bring: [],
    whats_included: [],
    image_url: null,
    price_type: "fixed" as const,
    price_tiers: null,
    duration_minutes: 60,
    location_type: "both" as const,
    is_active: true,
    sort_order: 1,
    created_at: "",
    updated_at: "",
  },
  selectedTier: null,
  quantity: 1,
  bookingDate: "2026-04-01",
  bookingTime: "10:00 AM",
  devoteeName: "Ravi Kumar",
  devoteeEmail: "ravi@example.com",
  devoteePhone: "512-555-0001",
  gotra: "Bharadwaja",
  nakshatra: "Pushya",
  rashi: "Karka",
  specialInstructions: "",
  familyMembers: [],
};

const sampleCartItemWithSuggestedDonation = {
  ...sampleCartItem,
  id: "cart-2",
  service: {
    ...sampleCartItem.service,
    id: "svc-2",
    name: "Archana",
    price: null,
    price_type: "donation" as const,
    suggested_donation: 21,
  },
  selectedTier: null,
};

const filledCartState = {
  items: [sampleCartItem],
  removeItem: vi.fn(),
  getTotal: () => 51,
  addItem: vi.fn(),
  updateItem: vi.fn(),
  clearCart: mockClearCart,
  getItemCount: () => 1,
};

const multiItemCartState = {
  items: [sampleCartItem, sampleCartItemWithSuggestedDonation],
  removeItem: vi.fn(),
  getTotal: () => 72,
  addItem: vi.fn(),
  updateItem: vi.fn(),
  clearCart: mockClearCart,
  getItemCount: () => 2,
};

const emptyCartState = {
  items: [],
  removeItem: vi.fn(),
  getTotal: () => 0,
  addItem: vi.fn(),
  updateItem: vi.fn(),
  clearCart: mockClearCart,
  getItemCount: () => 0,
};

let currentCartState: any = filledCartState;

vi.mock("@/store/cart", () => ({
  useCartStore: (selector?: any) => {
    if (typeof selector === "function") {
      return selector(currentCartState);
    }
    return currentCartState;
  },
}));

import CheckoutPage from "@/app/checkout/page";

describe("CheckoutPage", () => {
  beforeEach(() => {
    currentCartState = filledCartState;
    mockPush.mockClear();
    mockClearCart.mockClear();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );
  });

  describe("empty cart redirect", () => {
    it("redirects to /cart when cart is empty", () => {
      currentCartState = emptyCartState;
      render(<CheckoutPage />);
      expect(mockPush).toHaveBeenCalledWith("/cart");
    });

    it("shows a loading spinner while redirecting empty carts", () => {
      currentCartState = emptyCartState;
      const { container } = render(<CheckoutPage />);
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("checkout form with items", () => {
    it("renders checkout heading", () => {
      render(<CheckoutPage />);
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });

    it("shows Back to Cart link", () => {
      render(<CheckoutPage />);
      const link = screen.getByText("Back to Cart");
      expect(link.closest("a")).toHaveAttribute("href", "/cart");
    });

    it("displays Order Summary section", () => {
      render(<CheckoutPage />);
      expect(screen.getByText("Order Summary")).toBeInTheDocument();
    });

    it("shows item details in summary", () => {
      render(<CheckoutPage />);
      expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();
      expect(screen.getByText(/2026-04-01 at 10:00 AM/)).toBeInTheDocument();
    });

    it("displays total amount", () => {
      render(<CheckoutPage />);
      expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("shows Payment Method section", () => {
      render(<CheckoutPage />);
      expect(screen.getByText("Payment Method")).toBeInTheDocument();
    });

    it("shows credit card option selected by default", () => {
      render(<CheckoutPage />);
      expect(
        screen.getByText("Credit / Debit Card")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/visa, mastercard, amex via stripe/i)
      ).toBeInTheDocument();
    });

    it("shows Zelle payment option", () => {
      render(<CheckoutPage />);
      expect(screen.getByText("Zelle")).toBeInTheDocument();
      expect(screen.getByText(/send to \(512\) 545-0473/i)).toBeInTheDocument();
    });

    it("shows security notice", () => {
      render(<CheckoutPage />);
      expect(
        screen.getByText(/your payment information is secure/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/501\(c\)\(3\)/i)).toBeInTheDocument();
    });

    it("displays Pay button with amount for Stripe", () => {
      render(<CheckoutPage />);
      expect(screen.getByText(/pay \$51\.00/i)).toBeInTheDocument();
    });

    it("switches to Zelle and shows instructions", () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]); // Zelle is the second radio
      expect(
        screen.getByText("Zelle Payment Instructions:")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/open your banking app/i)
      ).toBeInTheDocument();
      expect(screen.getByText("Complete Booking")).toBeInTheDocument();
    });

    it("shows all 4 Zelle instruction steps", () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      expect(screen.getByText(/open your banking app and select zelle/i)).toBeInTheDocument();
      expect(screen.getByText(/send payment of/i)).toBeInTheDocument();
      expect(screen.getByText(/include your name/i)).toBeInTheDocument();
      expect(screen.getByText(/click.*complete booking.*below/i)).toBeInTheDocument();
    });

    it("Stripe radio is checked by default", () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
    });

    it("Zelle radio becomes checked when clicked", () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      expect(radios[1]).toBeChecked();
      expect(radios[0]).not.toBeChecked();
    });

    it("switching back to Stripe hides Zelle instructions", () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      // Switch to Zelle
      fireEvent.click(radios[1]);
      expect(screen.getByText("Zelle Payment Instructions:")).toBeInTheDocument();
      // Switch back to Stripe
      fireEvent.click(radios[0]);
      expect(screen.queryByText("Zelle Payment Instructions:")).not.toBeInTheDocument();
    });

    it("button text changes when switching to Zelle", () => {
      render(<CheckoutPage />);
      expect(screen.getByText(/pay \$51\.00/i)).toBeInTheDocument();
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      expect(screen.getByText("Complete Booking")).toBeInTheDocument();
      expect(screen.queryByText(/pay \$51\.00/i)).not.toBeInTheDocument();
    });

    it("handles Zelle checkout flow", async () => {
      render(<CheckoutPage />);
      // Switch to Zelle
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      // Click Complete Booking
      fireEvent.click(screen.getByText("Complete Booking"));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });
      expect(mockClearCart).toHaveBeenCalled();
    });

    it("handles Stripe checkout flow with fetch error (shows error)", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        new Error("Network error")
      );
      render(<CheckoutPage />);
      fireEvent.click(screen.getByText(/pay \$51\.00/i));

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("handles Stripe checkout when fetch returns no URL (demo fallback)", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );
      render(<CheckoutPage />);
      fireEvent.click(screen.getByText(/pay \$51\.00/i));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });
      expect(mockClearCart).toHaveBeenCalled();
    });

    it("handles Stripe checkout when fetch returns URL (redirect)", async () => {
      const mockLocation = { href: "" };
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: mockLocation,
      });

      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ url: "https://checkout.stripe.com/session123" }), { status: 200 })
      );
      render(<CheckoutPage />);
      fireEvent.click(screen.getByText(/pay \$51\.00/i));

      await waitFor(() => {
        expect(mockLocation.href).toBe("https://checkout.stripe.com/session123");
      });

      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });

    it("shows Processing... while checkout is in progress", async () => {
      // Create a delayed response
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.spyOn(globalThis, "fetch").mockReturnValue(delayedPromise as any);

      render(<CheckoutPage />);
      fireEvent.click(screen.getByText(/pay \$51\.00/i));

      expect(screen.getByText("Processing...")).toBeInTheDocument();

      // Resolve to complete the test
      resolvePromise!(new Response(JSON.stringify({}), { status: 200 }));
      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });
    });

    it("button is disabled while processing", async () => {
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.spyOn(globalThis, "fetch").mockReturnValue(delayedPromise as any);

      render(<CheckoutPage />);
      const payBtn = screen.getByText(/pay \$51\.00/i);
      fireEvent.click(payBtn);

      const processingBtn = screen.getByText("Processing...");
      expect(processingBtn).toBeDisabled();

      resolvePromise!(new Response(JSON.stringify({}), { status: 200 }));
      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });
    });
  });

  describe("order confirmation", () => {
    it("shows confirmation page after successful checkout", async () => {
      render(<CheckoutPage />);
      // Switch to Zelle for simple flow
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      fireEvent.click(screen.getByText("Complete Booking"));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });

      expect(screen.getByText(/your booking id is/i)).toBeInTheDocument();
      expect(screen.getByText(/what happens next/i)).toBeInTheDocument();
      expect(
        screen.getByText(/confirmation email/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/arrive 15 minutes before/i)
      ).toBeInTheDocument();
    });

    it("shows Zelle payment reference in confirmation for Zelle orders", async () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      fireEvent.click(screen.getByText("Complete Booking"));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });
      expect(
        screen.getByText(/send your payment via zelle/i)
      ).toBeInTheDocument();
    });

    it("does NOT show Zelle reference in error state for Stripe orders", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
      render(<CheckoutPage />);
      fireEvent.click(screen.getByText(/pay \$51\.00/i));

      await waitFor(() => {
        expect(screen.getByText("fail")).toBeInTheDocument();
      });
      expect(
        screen.queryByText(/send your payment via zelle/i)
      ).not.toBeInTheDocument();
    });

    it("shows Return Home and Book Another Service links", async () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      fireEvent.click(screen.getByText("Complete Booking"));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });

      const homeLink = screen.getByText("Return Home");
      expect(homeLink.closest("a")).toHaveAttribute("href", "/");
      const bookLink = screen.getByText("Book Another Service");
      expect(bookLink.closest("a")).toHaveAttribute("href", "/services");
    });

    it("shows booking ID starting with RNHT-", async () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      fireEvent.click(screen.getByText("Complete Booking"));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });

      // Booking ID may appear multiple times (in text and in the ID display)
      const bookingIdEls = screen.getAllByText(/RNHT-/);
      expect(bookingIdEls.length).toBeGreaterThanOrEqual(1);
    });

    it("shows priest assignment notice", async () => {
      render(<CheckoutPage />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      fireEvent.click(screen.getByText("Complete Booking"));

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument();
      });
      expect(screen.getByText(/temple priest will be assigned/i)).toBeInTheDocument();
    });
  });

  describe("item with selectedTier", () => {
    it("shows tier name in order summary", () => {
      currentCartState = {
        ...filledCartState,
        items: [
          {
            ...sampleCartItem,
            selectedTier: {
              name: "Premium",
              price: 151,
              description: "Full ritual",
            },
          },
        ],
        getTotal: () => 151,
      };
      render(<CheckoutPage />);
      expect(screen.getByText("Premium")).toBeInTheDocument();
    });

    it("uses tier price instead of service price for display", () => {
      currentCartState = {
        ...filledCartState,
        items: [
          {
            ...sampleCartItem,
            selectedTier: {
              name: "Premium",
              price: 151,
              description: "Full ritual",
            },
          },
        ],
        getTotal: () => 151,
      };
      render(<CheckoutPage />);
      // "$151.00" appears for both the item price and the total
      expect(screen.getAllByText("$151.00").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("item with suggested_donation fallback", () => {
    it("uses suggested_donation when price is null", () => {
      currentCartState = {
        ...filledCartState,
        items: [sampleCartItemWithSuggestedDonation],
        getTotal: () => 21,
      };
      render(<CheckoutPage />);
      // "$21.00" appears for both the item price and the total
      expect(screen.getAllByText("$21.00").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("multiple items in cart", () => {
    it("shows all items in order summary", () => {
      currentCartState = multiItemCartState;
      render(<CheckoutPage />);
      expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();
      expect(screen.getByText("Archana")).toBeInTheDocument();
    });
  });

  describe("Stripe checkout sends correct request body", () => {
    it("sends items array with correct fields to /api/checkout", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );
      render(<CheckoutPage />);
      fireEvent.click(screen.getByText(/pay \$51\.00/i));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith("/api/checkout", expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }));
      });

      const callBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(callBody.items).toBeDefined();
      expect(callBody.items[0].serviceId).toBe("svc-1");
      expect(callBody.items[0].serviceName).toBe("Ganapathi Pooja");
      expect(callBody.items[0].price).toBe(51);
      expect(callBody.items[0].quantity).toBe(1);
      expect(callBody.items[0].bookingDate).toBe("2026-04-01");
      expect(callBody.items[0].bookingTime).toBe("10:00 AM");
    });
  });
});
