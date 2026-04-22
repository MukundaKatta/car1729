import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

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
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
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

const mockRemoveItem = vi.fn();

// Default empty cart mock
const emptyCartState = {
  items: [] as any[],
  removeItem: mockRemoveItem,
  getTotal: () => 0,
  addItem: vi.fn(),
  updateItem: vi.fn(),
  clearCart: vi.fn(),
  getItemCount: () => 0,
};

const sampleCartItem = {
  id: "cart-1",
  service: {
    id: "svc-1",
    name: "Ganapathi Pooja",
    price: 51,
    suggested_donation: null,
    category_id: "cat-2",
    slug: "ganapathi-pooja",
    short_description: "Sacred worship of Lord Ganesha",
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
  familyMembers: [{ name: "Lakshmi Kumar", relationship: "spouse" }],
};

const sampleCartItemWithTier = {
  ...sampleCartItem,
  id: "cart-2",
  selectedTier: { name: "Premium", price: 151, description: "Full ritual" },
  gotra: "",
  familyMembers: [],
};

let currentCartState = emptyCartState;

vi.mock("@/store/cart", () => ({
  useCartStore: (selector?: any) => {
    if (typeof selector === "function") {
      return selector(currentCartState);
    }
    return currentCartState;
  },
}));

import CartPage from "@/app/cart/page";

describe("CartPage", () => {
  beforeEach(() => {
    currentCartState = emptyCartState;
    mockRemoveItem.mockClear();
  });

  describe("empty cart", () => {
    it("renders empty cart message", () => {
      render(<CartPage />);
      expect(screen.getByText("Your Cart is Empty")).toBeInTheDocument();
    });

    it("displays empty cart description", () => {
      render(<CartPage />);
      expect(
        screen.getByText(/browse our services and add poojas/i)
      ).toBeInTheDocument();
    });

    it("shows Browse Services link pointing to /services", () => {
      render(<CartPage />);
      const link = screen.getByText("Browse Services");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/services");
    });
  });

  describe("cart with items", () => {
    beforeEach(() => {
      currentCartState = {
        ...emptyCartState,
        items: [sampleCartItem as any],
        getTotal: () => 51,
      };
    });

    it("renders the cart heading", () => {
      render(<CartPage />);
      expect(screen.getByText("Your Cart")).toBeInTheDocument();
    });

    it("shows item count text", () => {
      render(<CartPage />);
      expect(screen.getByText(/1 service in your cart/i)).toBeInTheDocument();
    });

    it("displays pluralized service count for multiple items", () => {
      currentCartState = {
        ...emptyCartState,
        items: [sampleCartItem as any, sampleCartItemWithTier as any],
        getTotal: () => 202,
      };
      render(<CartPage />);
      expect(
        screen.getByText(/2 services in your cart/i)
      ).toBeInTheDocument();
    });

    it("displays the service name", () => {
      render(<CartPage />);
      expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();
    });

    it("displays booking date and time", () => {
      render(<CartPage />);
      expect(screen.getByText(/2026-04-01/)).toBeInTheDocument();
      expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
    });

    it("displays devotee name", () => {
      render(<CartPage />);
      expect(screen.getByText(/Ravi Kumar/)).toBeInTheDocument();
    });

    it("displays gotra when present", () => {
      render(<CartPage />);
      expect(screen.getByText(/Bharadwaja/)).toBeInTheDocument();
    });

    it("displays family members when present", () => {
      render(<CartPage />);
      expect(screen.getByText(/Lakshmi Kumar/)).toBeInTheDocument();
    });

    it("displays the price", () => {
      render(<CartPage />);
      // Price appears on item and in order summary total
      const prices = screen.getAllByText("$51.00");
      expect(prices.length).toBeGreaterThanOrEqual(1);
    });

    it("displays total amount", () => {
      render(<CartPage />);
      // The summary total
      expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("shows Continue Browsing link to /services", () => {
      render(<CartPage />);
      const link = screen.getByText("Continue Browsing");
      expect(link.closest("a")).toHaveAttribute("href", "/services");
    });

    it("shows Proceed to Checkout link to /checkout", () => {
      render(<CartPage />);
      const link = screen.getByText("Proceed to Checkout");
      expect(link.closest("a")).toHaveAttribute("href", "/checkout");
    });

    it("calls removeItem when trash button is clicked", () => {
      render(<CartPage />);
      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      expect(mockRemoveItem).toHaveBeenCalledWith("cart-1");
    });

    it("shows tier name when selectedTier is present", () => {
      currentCartState = {
        ...emptyCartState,
        items: [sampleCartItemWithTier as any],
        getTotal: () => 151,
      };
      render(<CartPage />);
      expect(screen.getByText("Premium")).toBeInTheDocument();
      // Price appears on item and in order summary total
      const prices = screen.getAllByText("$151.00");
      expect(prices.length).toBeGreaterThanOrEqual(1);
    });

    it("does not display gotra when it is empty", () => {
      currentCartState = {
        ...emptyCartState,
        items: [sampleCartItemWithTier as any],
        getTotal: () => 151,
      };
      render(<CartPage />);
      expect(screen.queryByText("Gotra:")).not.toBeInTheDocument();
    });
  });
});
