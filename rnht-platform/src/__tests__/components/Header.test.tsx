import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import React from "react";

// --- Mocks ---
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

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/font/google", () => ({
  Playfair_Display: () => ({
    className: "mock-playfair",
    variable: "--font-heading",
  }),
  Cormorant_Garamond: () => ({
    className: "mock-cormorant",
    variable: "--font-accent",
  }),
}));

// Mutable state references for overriding in tests
let mockCartState: any = { items: [] as any[], getItemCount: () => 0 };
let mockAuthState: any = { isAuthenticated: false, user: null, initialize: vi.fn() };
const mockSetLocale = vi.fn();

// useCartStore is called with a selector: useCartStore((s) => s.items.length)
vi.mock("@/store/cart", () => ({
  useCartStore: (sel: any) => {
    return typeof sel === "function" ? sel(mockCartState) : mockCartState;
  },
}));
// useLanguageStore is called WITHOUT a selector: const { locale, setLocale } = useLanguageStore()
vi.mock("@/store/language", () => ({
  useLanguageStore: () => ({ locale: "en" as const, setLocale: mockSetLocale }),
}));
// useAuthStore is called WITHOUT a selector: const { isAuthenticated, user } = useAuthStore()
vi.mock("@/store/auth", () => ({
  useAuthStore: () => mockAuthState,
}));
vi.mock("@/store/slideshow", () => ({
  useSlideshowStore: (sel: any) => {
    const s = {
      slides: [],
      loading: false,
      fetchSlides: vi.fn(),
    };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { onAuthStateChange: vi.fn() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null }),
          order: () => ({ data: [] }),
        }),
        order: () => ({ data: [] }),
      }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/img.jpg" },
        }),
      }),
    },
  },
}));

import { Header, HangingLamp } from "@/components/layout/Header";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartState = { items: [] as any[], getItemCount: () => 0 };
    mockAuthState = { isAuthenticated: false, user: null, initialize: vi.fn() };
    mockPathname = "/";
  });

  // --- Rendering ---

  it("renders the header element", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the RNHT logo image with correct alt text", () => {
    render(<Header />);
    const logo = screen.getByAltText("RNHT Logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute(
      "src",
      "/cropped-RNHT_Logo_512x512_transparent-150x150.png"
    );
  });

  it("renders the temple name text", () => {
    render(<Header />);
    expect(screen.getByText("Rudra Narayana")).toBeInTheDocument();
    expect(screen.getByText("Hindu Temple")).toBeInTheDocument();
  });

  it("renders the logo as a link to the homepage", () => {
    render(<Header />);
    const logoLink = screen.getByAltText("RNHT Logo").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  // --- Navigation Links ---

  it("renders all desktop navigation links", () => {
    render(<Header />);
    const expectedLinks = [
      { name: "Home", href: "/" },
      { name: "Gallery", href: "/gallery" },
      { name: "Services", href: "/services" },
      { name: "Priests", href: "/priests" },
      { name: "About us", href: "/about" },
      { name: "Contact us", href: "/contact" },
    ];

    expectedLinks.forEach(({ name, href }) => {
      const links = screen.getAllByText(name);
      const link = links.find((el) => el.closest("a")?.getAttribute("href") === href);
      expect(link).toBeTruthy();
    });
  });

  it("renders the Panchangam button", () => {
    render(<Header />);
    const panchangamLinks = screen.getAllByText("Panchangam");
    expect(panchangamLinks.length).toBeGreaterThan(0);
    const link = panchangamLinks[0].closest("a");
    expect(link).toHaveAttribute("href", "/panchangam");
  });

  it("renders the Donate button with correct href", () => {
    render(<Header />);
    const donateLinks = screen.getAllByText("Donate");
    expect(donateLinks.length).toBeGreaterThan(0);
    const link = donateLinks[0].closest("a");
    expect(link).toHaveAttribute("href", "/donate");
  });

  it("renders the cart link", () => {
    render(<Header />);
    const cartLink = screen.getByLabelText("Shopping cart");
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute("href", "/cart");
  });

  it("renders the dashboard/sign-in link", () => {
    render(<Header />);
    const dashLink = screen.getByLabelText("Sign in");
    expect(dashLink).toBeInTheDocument();
    expect(dashLink).toHaveAttribute("href", "/dashboard");
  });

  // --- Active Link ---

  it("highlights the Home link as active when pathname is /", () => {
    render(<Header />);
    const homeLinks = screen.getAllByText("Home");
    const desktopHome = homeLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(desktopHome).toBeTruthy();
  });

  it("highlights the Services link as active when pathname starts with /services", () => {
    mockPathname = "/services";
    render(<Header />);
    const servicesLinks = screen.getAllByText("Services");
    const activeLink = servicesLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(activeLink).toBeTruthy();
  });

  it("does not highlight Home when pathname is /services", () => {
    mockPathname = "/services";
    render(<Header />);
    const homeLinks = screen.getAllByText("Home");
    const desktopHome = homeLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(desktopHome).toBeFalsy();
  });

  it("highlights Gallery link as active when pathname starts with /gallery", () => {
    mockPathname = "/gallery";
    render(<Header />);
    const galleryLinks = screen.getAllByText("Gallery");
    const activeLink = galleryLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(activeLink).toBeTruthy();
  });

  it("shows active link underline indicator for Home", () => {
    render(<Header />);
    const homeLinks = screen.getAllByText("Home");
    const activeHome = homeLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    const underline = activeHome?.querySelector("span.absolute");
    expect(underline).toBeTruthy();
  });

  it("highlights About us link when pathname starts with /about", () => {
    mockPathname = "/about";
    render(<Header />);
    const aboutLinks = screen.getAllByText("About us");
    const activeLink = aboutLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(activeLink).toBeTruthy();
  });

  it("highlights Contact us link when pathname starts with /contact", () => {
    mockPathname = "/contact";
    render(<Header />);
    const contactLinks = screen.getAllByText("Contact us");
    const activeLink = contactLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(activeLink).toBeTruthy();
  });

  it("highlights Priests link when pathname starts with /priests", () => {
    mockPathname = "/priests";
    render(<Header />);
    const priestsLinks = screen.getAllByText("Priests");
    const activeLink = priestsLinks.find((el) =>
      el.className?.includes("text-temple-maroon")
    );
    expect(activeLink).toBeTruthy();
  });

  // --- Mobile Menu ---

  it("renders the mobile menu toggle button", () => {
    render(<Header />);
    const menuButton = screen.getByLabelText("Open menu");
    expect(menuButton).toBeInTheDocument();
  });

  it("opens the mobile menu when the menu button is clicked", () => {
    render(<Header />);
    const menuButton = screen.getByLabelText("Open menu");
    fireEvent.click(menuButton);
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
  });

  it("shows navigation links in the mobile menu when opened", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));

    const mobileNavNames = [
      "Home",
      "Gallery",
      "Services",
      "Priests",
      "About us",
      "Contact us",
    ];
    mobileNavNames.forEach((name) => {
      const links = screen.getAllByText(name);
      expect(links.length).toBeGreaterThanOrEqual(2); // desktop + mobile
    });
  });

  it("shows the mobile donate button in the mobile menu", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByText("Donate Now")).toBeInTheDocument();
  });

  it("shows the mobile Panchangam link in the mobile menu", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const panchangamLinks = screen.getAllByText("Panchangam");
    expect(panchangamLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("closes the mobile menu when the close button is clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("sets aria-expanded attribute on the mobile menu button", () => {
    render(<Header />);
    const menuButton = screen.getByLabelText("Open menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    const closeButton = screen.getByLabelText("Close menu");
    expect(closeButton).toHaveAttribute("aria-expanded", "true");
  });

  it("prevents body scroll when mobile menu is open", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when mobile menu is closed", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(document.body.style.overflow).toBe("");
  });

  it("closes mobile menu when the overlay backdrop is clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));

    const backdrop = document.querySelector("[aria-hidden='true'].fixed");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);

    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("mobile menu shows active link highlighting", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const homeLinks = screen.getAllByText("Home");
    const mobileHome = homeLinks.find((el) =>
      el.className?.includes("text-temple-red")
    );
    expect(mobileHome).toBeTruthy();
  });

  it("mobile donate button links to /donate", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const donateNow = screen.getByText("Donate Now");
    expect(donateNow.closest("a")).toHaveAttribute("href", "/donate");
  });

  it("mobile Panchangam link has correct href", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const panchangamLinks = screen.getAllByText("Panchangam");
    const mobileLink = panchangamLinks.find((el) => {
      const a = el.closest("a");
      return a?.getAttribute("href") === "/panchangam";
    });
    expect(mobileLink).toBeTruthy();
  });

  // --- Language Picker ---

  it("renders the language picker button", () => {
    render(<Header />);
    const langButton = screen.getByLabelText("Select language");
    expect(langButton).toBeInTheDocument();
  });

  it("displays the current locale abbreviation", () => {
    render(<Header />);
    const langButton = screen.getByLabelText("Select language");
    expect(within(langButton).getByText("en")).toBeInTheDocument();
  });

  it("opens the language picker dropdown when clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Select language"));
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows all locale options in the language picker", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Select language"));
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("closes language picker when clicking outside", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Select language"));
    expect(screen.getByText("English")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    const dropdownItems = document.querySelectorAll(".animate-slide-down");
    expect(dropdownItems.length).toBe(0);
  });

  it("selects a language from the desktop dropdown and closes picker", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Select language"));

    const englishBtn = screen.getByText("English").closest("button");
    expect(englishBtn).toBeTruthy();
    fireEvent.click(englishBtn!);

    expect(mockSetLocale).toHaveBeenCalledWith("en");

    const dropdownItems = document.querySelectorAll(".animate-slide-down");
    expect(dropdownItems.length).toBe(0);
  });

  it("toggles language picker open and closed", () => {
    render(<Header />);
    const langButton = screen.getByLabelText("Select language");

    fireEvent.click(langButton);
    expect(document.querySelectorAll(".animate-slide-down").length).toBe(1);

    fireEvent.click(langButton);
    expect(document.querySelectorAll(".animate-slide-down").length).toBe(0);
  });

  // --- Mobile Language Picker ---

  it("shows language options in the mobile menu", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("mobile language buttons call setLocale when clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    const langSection = screen.getByText("Language").closest("div.border-t");
    expect(langSection).toBeTruthy();
    const englishBtns = within(langSection as HTMLElement).getAllByRole("button", { name: /english/i });
    expect(englishBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(englishBtns[0]);
    expect(mockSetLocale).toHaveBeenCalledWith("en");
  });

  // --- Cart Badge ---

  it("does not show a cart badge when item count is 0", () => {
    render(<Header />);
    const cartLink = screen.getByLabelText("Shopping cart");
    const badge = cartLink.querySelector("span");
    expect(badge).toBeNull();
  });

  it("shows correct aria-label for cart with no items", () => {
    render(<Header />);
    const cartLink = screen.getByLabelText("Shopping cart");
    expect(cartLink).toBeInTheDocument();
  });

  // --- Hanging Bells ---

  it("renders hanging bells decoration", () => {
    render(<Header />);
    const bellsContainer = document.querySelector("[aria-hidden='true']");
    expect(bellsContainer).not.toBeNull();
  });

  // --- Gold Accent Line ---

  it("renders the top gold accent line", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    const goldLine = header.querySelector(".h-1");
    expect(goldLine).not.toBeNull();
  });

  // --- Sticky Header ---

  it("has sticky positioning", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header.className).toContain("sticky");
    expect(header.className).toContain("top-0");
  });

  // --- Panchangam aria-label for mobile ---

  it("mobile Panchangam icon-only button has aria-label", () => {
    render(<Header />);
    const panchangamLabel = screen.getByLabelText("Panchangam");
    expect(panchangamLabel).toBeInTheDocument();
    expect(panchangamLabel.closest("a")).toHaveAttribute("href", "/panchangam");
  });

  // --- Donate mobile icon-only button ---

  it("mobile Donate icon-only button has aria-label", () => {
    render(<Header />);
    const donateLabel = screen.getByLabelText("Donate");
    expect(donateLabel).toBeInTheDocument();
    expect(donateLabel.closest("a")).toHaveAttribute("href", "/donate");
  });

  // --- Mobile link click handlers (close menu) ---

  it("closes mobile menu when clicking mobile donate link", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    const donateNow = screen.getByText("Donate Now");
    fireEvent.click(donateNow.closest("a")!);
    // Menu should close
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes mobile menu when clicking mobile Panchangam link", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    // Find the mobile Panchangam link (inside the mobile menu)
    const panchangamLinks = screen.getAllByText("Panchangam");
    // The mobile one is inside the fixed menu div
    const mobileLink = panchangamLinks.find((el) => {
      const parent = el.closest(".fixed.inset-x-0");
      return parent !== null;
    });
    if (mobileLink) {
      fireEvent.click(mobileLink.closest("a")!);
    }
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("closes mobile menu when clicking a mobile nav link", () => {
    render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    // Click a navigation link in the mobile menu (e.g. Services)
    const servicesLinks = screen.getAllByText("Services");
    // The mobile one is inside the mobile menu panel
    const mobileServices = servicesLinks.find((el) => {
      const parent = el.closest(".fixed.inset-x-0");
      return parent !== null;
    });
    if (mobileServices) {
      fireEvent.click(mobileServices.closest("a")!);
    }
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  // --- Header height measurement ---

  it("sets CSS variable --header-h on mount and removes listener on unmount", () => {
    const setPropertySpy = vi.spyOn(document.documentElement.style, "setProperty");
    const { unmount } = render(<Header />);
    // On mount, update() is called which sets the CSS variable
    expect(setPropertySpy).toHaveBeenCalledWith("--header-h", expect.any(String));
    unmount();
    setPropertySpy.mockRestore();
  });

  it("updates --header-h on window resize", () => {
    const setPropertySpy = vi.spyOn(document.documentElement.style, "setProperty");
    render(<Header />);
    // Fire resize
    fireEvent(window, new Event("resize"));
    // Should have been called again
    const calls = setPropertySpy.mock.calls.filter((c) => c[0] === "--header-h");
    expect(calls.length).toBeGreaterThanOrEqual(2); // initial + resize
    setPropertySpy.mockRestore();
  });

  it("cleans up resize listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Header />);
    unmount();
    const resizeCalls = removeSpy.mock.calls.filter((c) => c[0] === "resize");
    expect(resizeCalls.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });

  // --- Body overflow cleanup on unmount ---

  it("restores body overflow when component unmounts while mobile menu is open", () => {
    const { unmount } = render(<Header />);
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  // --- Language picker does not register listener when not open ---

  it("does not add mousedown listener when language picker is not open", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    render(<Header />);
    const mousedownCalls = addSpy.mock.calls.filter((c) => c[0] === "mousedown");
    expect(mousedownCalls.length).toBe(0);
    addSpy.mockRestore();
  });

  it("cleans up mousedown listener when language picker closes", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    render(<Header />);
    // Open picker
    fireEvent.click(screen.getByLabelText("Select language"));
    // Close picker by clicking the button again
    fireEvent.click(screen.getByLabelText("Select language"));
    const mousedownCalls = removeSpy.mock.calls.filter((c) => c[0] === "mousedown");
    expect(mousedownCalls.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });
});

describe("HangingLamp", () => {
  it("renders the HangingLamp SVG with default props", () => {
    const { container } = render(<HangingLamp />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 50 130");
  });

  it("renders HangingLamp with small size", () => {
    const { container } = render(<HangingLamp size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("40");
    expect(svg?.getAttribute("height")).toBe("160");
  });

  it("renders HangingLamp with large size", () => {
    const { container } = render(<HangingLamp size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("64");
    expect(svg?.getAttribute("height")).toBe("240");
  });

  it("renders HangingLamp with custom id and className", () => {
    const { container } = render(<HangingLamp id="test-lamp" className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("custom-class")).toBe(true);
    // Check that gradient IDs use the custom id prefix
    const gradient = svg?.querySelector("#test-lampch");
    expect(gradient).toBeInTheDocument();
  });
});

describe("Header with cart items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartState = { items: [] as any[], getItemCount: () => 0 };
    mockAuthState = { isAuthenticated: false, user: null, initialize: vi.fn() };
    mockPathname = "/";
  });

  it("shows a cart badge when items are present", () => {
    mockCartState = { items: [{ id: "1" }, { id: "2" }], getItemCount: () => 2 };

    render(<Header />);
    const cartLink = screen.getByLabelText(/Shopping cart, 2 items/);
    expect(cartLink).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("cart badge shows correct count for 1 item", () => {
    mockCartState = { items: [{ id: "1" }], getItemCount: () => 1 };

    render(<Header />);
    const cartLink = screen.getByLabelText(/Shopping cart, 1 items/);
    expect(cartLink).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("cart badge shows correct count for 5 items", () => {
    mockCartState = {
      items: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }],
      getItemCount: () => 5,
    };

    render(<Header />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

describe("Header with authenticated user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartState = { items: [] as any[], getItemCount: () => 0 };
    mockAuthState = { isAuthenticated: false, user: null, initialize: vi.fn() };
    mockPathname = "/";
  });

  it("shows user initial when authenticated", () => {
    mockAuthState = { isAuthenticated: true, user: { name: "Mukunda" }, initialize: vi.fn() };

    render(<Header />);
    const dashLink = screen.getByLabelText("Dashboard");
    expect(dashLink).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("shows fallback initial U when user has no name", () => {
    mockAuthState = { isAuthenticated: true, user: { name: "" }, initialize: vi.fn() };

    render(<Header />);
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("shows fallback initial U when user name is null", () => {
    mockAuthState = { isAuthenticated: true, user: { name: null }, initialize: vi.fn() };

    render(<Header />);
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("shows Dashboard aria-label when authenticated", () => {
    mockAuthState = { isAuthenticated: true, user: { name: "Mukunda" }, initialize: vi.fn() };

    render(<Header />);
    expect(screen.getByLabelText("Dashboard")).toBeInTheDocument();
  });

  it("shows Sign in aria-label when not authenticated", () => {
    mockAuthState = { isAuthenticated: false, user: null, initialize: vi.fn() };

    render(<Header />);
    expect(screen.getByLabelText("Sign in")).toBeInTheDocument();
  });

  it("user avatar is rendered in a circular div with initial", () => {
    mockAuthState = { isAuthenticated: true, user: { name: "Priya" }, initialize: vi.fn() };

    render(<Header />);
    const initial = screen.getByText("P");
    expect(initial).toBeInTheDocument();
    expect(initial.className).toContain("rounded-full");
  });

  it("shows fallback initial U when user object is null", () => {
    mockAuthState = { isAuthenticated: true, user: null, initialize: vi.fn() };

    render(<Header />);
    expect(screen.getByText("U")).toBeInTheDocument();
  });
});
