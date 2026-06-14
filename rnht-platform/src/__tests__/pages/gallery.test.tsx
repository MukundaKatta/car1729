/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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
vi.mock("@/store/cart", () => ({
  useCartStore: () => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    getTotal: () => 0,
    getItemCount: () => 0,
  }),
}));
vi.mock("@/store/language", () => ({
  useLanguageStore: () => ({ locale: "en", setLocale: vi.fn() }),
}));
vi.mock("@/store/auth", () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
    initialize: vi.fn(),
  }),
}));

import GalleryPage from "@/app/gallery/page";

describe("GalleryPage", () => {
  it("renders without crashing", () => {
    render(<GalleryPage />);
  });

  it("displays the page heading", () => {
    render(<GalleryPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /gallery/i })
    ).toBeInTheDocument();
  });

  it("shows the subtitle text", () => {
    render(<GalleryPage />);
    expect(
      screen.getByText(/glimpses of divine moments/i)
    ).toBeInTheDocument();
  });

  it("renders category filter buttons", () => {
    render(<GalleryPage />);
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ceremonies" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Darshan" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Weddings" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Priests" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Community" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Festivals" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Home Services" })
    ).toBeInTheDocument();
  });

  it("shows all 25 images by default", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(25);
  });

  it("filters images when clicking a category", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Weddings" }));
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute(
      "alt",
      "Wedding ceremony with priest and couple"
    );
  });

  it("filters to Darshan category correctly", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Darshan" }));
    const images = screen.getAllByRole("img");
    // Count Darshan images: gallery-05,08,09,14,16,19,24 = 7
    expect(images).toHaveLength(7);
  });

  it("returns to all images when clicking All after a filter", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Weddings" }));
    expect(screen.getAllByRole("img")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("img")).toHaveLength(25);
  });

  it("opens lightbox when clicking an image", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    // Click the first image's parent div
    fireEvent.click(images[0].closest("button")!);
    // Lightbox should be visible - a larger image appears
    const allImages = screen.getAllByRole("img");
    // 25 grid images + 1 lightbox image = 26
    expect(allImages).toHaveLength(26);
  });

  it("shows image alt text as caption in lightbox", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    // The first image alt is used as caption
    expect(
      screen.getByText("Priest conducting ceremony with family")
    ).toBeInTheDocument();
  });

  it("navigates to next image in lightbox", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    // Find the next button (ChevronRight)
    const buttons = screen.getAllByRole("button");
    // The right arrow button is the one on the right side
    const nextButton = buttons.find(
      (b) => b.className.includes("right-4") && b.className.includes("top-1/2")
    );
    expect(nextButton).toBeDefined();
    fireEvent.click(nextButton!);
    // Caption should now show the second image's alt
    expect(
      screen.getByText("Priest performing pooja at mandapam")
    ).toBeInTheDocument();
  });

  it("navigates to previous image in lightbox", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    // Find the prev button (ChevronLeft)
    const buttons = screen.getAllByRole("button");
    const prevButton = buttons.find(
      (b) => b.className.includes("left-4") && b.className.includes("top-1/2")
    );
    expect(prevButton).toBeDefined();
    fireEvent.click(prevButton!);
    // Should wrap around to the last image
    expect(
      screen.getByText("Ram Parivar event - priest addressing devotees")
    ).toBeInTheDocument();
  });

  it("closes lightbox when clicking close button", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    expect(screen.getAllByRole("img")).toHaveLength(26);
    // Find close button (top-right with X)
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find(
      (b) => b.className.includes("right-4") && b.className.includes("top-4")
    );
    expect(closeButton).toBeDefined();
    fireEvent.click(closeButton!);
    expect(screen.getAllByRole("img")).toHaveLength(25);
  });

  it("closes lightbox when clicking the backdrop", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    expect(screen.getAllByRole("img")).toHaveLength(26);
    // Click the backdrop (the fixed overlay)
    const backdrop = document.querySelector(".fixed.inset-0");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(screen.getAllByRole("img")).toHaveLength(25);
  });

  it("shows the Want to see more CTA section", () => {
    render(<GalleryPage />);
    expect(
      screen.getByRole("heading", { name: /want to see more/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse our complete collection/i)
    ).toBeInTheDocument();
  });

  it("has a Google Drive link", () => {
    render(<GalleryPage />);
    const link = screen.getByRole("link", {
      name: /view full gallery on google drive/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("lightbox works with filtered images", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Priests" }));
    const images = screen.getAllByRole("img");
    // Priests category has 2 images
    expect(images).toHaveLength(2);
    fireEvent.click(images[0].closest("button")!);
    // 2 grid + 1 lightbox = 3
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  // --- Additional tests for improved coverage ---

  it("filters to Ceremonies category correctly", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Ceremonies" }));
    const images = screen.getAllByRole("img");
    // gallery-01,02,03,06,11,15,17,18,21 = 9
    expect(images).toHaveLength(9);
  });

  it("filters to Community category correctly", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Community" }));
    const images = screen.getAllByRole("img");
    // gallery-04, gallery-22 = 2
    expect(images).toHaveLength(2);
  });

  it("filters to Festivals category correctly", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Festivals" }));
    const images = screen.getAllByRole("img");
    // gallery-23, gallery-25 = 2
    expect(images).toHaveLength(2);
  });

  it("filters to Home Services category correctly", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Home Services" }));
    const images = screen.getAllByRole("img");
    // gallery-12, gallery-13 = 2
    expect(images).toHaveLength(2);
  });

  it("lightbox navigates forward multiple times", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Priests" }));
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);

    // First image caption
    expect(screen.getByText("Both priests seated with deity idols")).toBeInTheDocument();

    // Navigate next
    const buttons = screen.getAllByRole("button");
    const nextButton = buttons.find(
      (b) => b.className.includes("right-4") && b.className.includes("top-1/2")
    );
    fireEvent.click(nextButton!);
    expect(screen.getByText("Pandit Aditya Sharma with Shiva yantra")).toBeInTheDocument();

    // Navigate next again (should wrap to first)
    fireEvent.click(nextButton!);
    expect(screen.getByText("Both priests seated with deity idols")).toBeInTheDocument();
  });

  it("lightbox navigates backward multiple times", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Priests" }));
    const images = screen.getAllByRole("img");
    fireEvent.click(images[1].closest("button")!);

    // Second image caption
    expect(screen.getByText("Pandit Aditya Sharma with Shiva yantra")).toBeInTheDocument();

    // Navigate prev
    const buttons = screen.getAllByRole("button");
    const prevButton = buttons.find(
      (b) => b.className.includes("left-4") && b.className.includes("top-1/2")
    );
    fireEvent.click(prevButton!);
    expect(screen.getByText("Both priests seated with deity idols")).toBeInTheDocument();

    // Navigate prev again (should wrap to last)
    fireEvent.click(prevButton!);
    expect(screen.getByText("Pandit Aditya Sharma with Shiva yantra")).toBeInTheDocument();
  });

  it("lightbox image content area click does not close lightbox", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    expect(screen.getAllByRole("img")).toHaveLength(26);

    // Click on the image container (not the backdrop)
    const imageContainer = document.querySelector(".relative.max-h-\\[85vh\\]");
    expect(imageContainer).toBeTruthy();
    fireEvent.click(imageContainer!);
    // Lightbox should still be open
    expect(screen.getAllByRole("img")).toHaveLength(26);
  });

  it("lightbox shows correct image source for first image", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    const allImages = screen.getAllByRole("img");
    // The lightbox image (last one) should have the full-size source
    const lightboxImg = allImages[allImages.length - 1];
    expect(lightboxImg).toHaveAttribute("src", "/gallery/gallery-01.jpg");
  });

  it("All button has active styling by default", () => {
    render(<GalleryPage />);
    const allBtn = screen.getByRole("button", { name: "All" });
    expect(allBtn.className).toContain("bg-temple-red");
    expect(allBtn.className).toContain("text-white");
  });

  it("category button styling changes on selection", () => {
    render(<GalleryPage />);
    const ceremoniesBtn = screen.getByRole("button", { name: "Ceremonies" });
    // Initially not selected
    expect(ceremoniesBtn.className).not.toContain("bg-temple-red");

    fireEvent.click(ceremoniesBtn);
    // Now should be selected
    expect(ceremoniesBtn.className).toContain("bg-temple-red");
    expect(ceremoniesBtn.className).toContain("text-white");

    // All button should no longer be active
    const allBtn = screen.getByRole("button", { name: "All" });
    expect(allBtn.className).not.toContain("bg-temple-red");
  });

  it("lightbox opens on second image and shows correct caption", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[1].closest("button")!);
    expect(screen.getByText("Priest performing pooja at mandapam")).toBeInTheDocument();
  });

  it("lightbox opens on last image and shows correct caption", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[24].closest("button")!);
    expect(screen.getByText("Ram Parivar event - priest addressing devotees")).toBeInTheDocument();
  });

  it("next from last image wraps to first", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[24].closest("button")!);
    expect(screen.getByText("Ram Parivar event - priest addressing devotees")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const nextButton = buttons.find(
      (b) => b.className.includes("right-4") && b.className.includes("top-1/2")
    );
    fireEvent.click(nextButton!);
    expect(screen.getByText("Priest conducting ceremony with family")).toBeInTheDocument();
  });

  it("prev from first image wraps to last", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    fireEvent.click(images[0].closest("button")!);
    expect(screen.getByText("Priest conducting ceremony with family")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const prevButton = buttons.find(
      (b) => b.className.includes("left-4") && b.className.includes("top-1/2")
    );
    fireEvent.click(prevButton!);
    expect(screen.getByText("Ram Parivar event - priest addressing devotees")).toBeInTheDocument();
  });

  it("Google Drive link has noopener noreferrer", () => {
    render(<GalleryPage />);
    const link = screen.getByRole("link", {
      name: /view full gallery on google drive/i,
    });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("switching filter while lightbox is closed resets images", () => {
    render(<GalleryPage />);
    fireEvent.click(screen.getByRole("button", { name: "Darshan" }));
    expect(screen.getAllByRole("img")).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: "Weddings" }));
    expect(screen.getAllByRole("img")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("img")).toHaveLength(25);
  });

  it("each grid image has correct src attribute", () => {
    render(<GalleryPage />);
    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("src", "/gallery/gallery-01.jpg");
    expect(images[24]).toHaveAttribute("src", "/gallery/gallery-25.jpg");
  });
});
