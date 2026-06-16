/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
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

vi.mock("@/store/cart", () => ({
  useCartStore: (sel: any) => {
    const s = { items: [], getItemCount: () => 0 };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/store/language", () => ({
  useLanguageStore: (sel: any) => {
    const s = { locale: "en", setLocale: vi.fn() };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/store/auth", () => ({
  useAuthStore: (sel: any) => {
    const s = { isAuthenticated: false, user: null, initialize: vi.fn() };
    return typeof sel === "function" ? sel(s) : s;
  },
}));

const mockFetchSlides = vi.fn();

const defaultSlides = [
  {
    id: "1",
    type: "image",
    url: "https://example.com/img1.jpg",
    title: "Welcome to RNHT",
    subtitle: "A sacred space for all",
    ctaText: "Learn More",
    ctaLink: "/services",
    isActive: true,
    showText: true,
    sortOrder: 0,
  },
  {
    id: "2",
    type: "image",
    url: "https://example.com/img2.jpg",
    title: "Divine Services",
    subtitle: "Traditional Vedic ceremonies",
    ctaText: "Book Now",
    ctaLink: "/services",
    isActive: true,
    showText: true,
    sortOrder: 1,
  },
  {
    id: "3",
    type: "video",
    url: "https://example.com/video.mp4",
    title: "Temple Tour",
    subtitle: "Explore our temple",
    ctaText: "Watch",
    ctaLink: "/gallery",
    isActive: true,
    showText: true,
    sortOrder: 2,
  },
];

let mockSlideshowState: any = {
  slides: defaultSlides,
  loading: false,
  fetchSlides: mockFetchSlides,
};

vi.mock("@/store/slideshow", () => ({
  useSlideshowStore: (sel: any) => {
    return typeof sel === "function" ? sel(mockSlideshowState) : mockSlideshowState;
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

// Mock sample-data used by HangingPanchangamScroll
vi.mock("@/lib/sample-data", () => ({
  samplePanchangam: {
    masa: "Phalguna",
    samvatsara: "Shobhakrit",
    tithi: { paksha: "Shukla", name: "Purnima", start: "06:12", end: "04:45" },
    nakshatra: { name: "Uttara Phalguni", start: "07:30", end: "06:15" },
    karana: { name: "Bava", start: "06:12", end: "17:28" },
    yoga: { name: "Siddha", start: "09:45", end: "08:30" },
    sunrise: "06:45",
    sunset: "18:30",
    rahu_kalam: { start: "15:00", end: "16:30" },
    location: "Austin, TX",
  },
}));

// Mock lucide-react icons to render simple elements
vi.mock("lucide-react", () => ({
  ChevronLeft: (props: any) => <svg data-testid="chevron-left" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="chevron-right" {...props} />,
  Pause: (props: any) => <svg data-testid="pause-icon" {...props} />,
  Play: (props: any) => <svg data-testid="play-icon" {...props} />,
}));

import { HeroSlideshow } from "@/components/slideshow/HeroSlideshow";

/**
 * Helper: query all slide group elements (including aria-hidden ones).
 * The component sets aria-hidden={true} on non-active slides, which removes
 * them from the default accessibility tree. We must pass { hidden: true }
 * to getAllByRole so that Testing Library includes them.
 */
function getAllSlides() {
  return screen.getAllByRole("group", { hidden: true });
}

describe("HeroSlideshow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSlideshowState = {
      slides: defaultSlides,
      loading: false,
      fetchSlides: mockFetchSlides,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Basic Rendering ---

  it("renders the slideshow section with carousel aria attributes", () => {
    render(<HeroSlideshow />);
    // <section aria-label="Temple highlights" aria-roledescription="carousel">
    const section = screen.getByRole("region", { name: "Temple highlights" });
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("calls fetchSlides on mount", () => {
    render(<HeroSlideshow />);
    expect(mockFetchSlides).toHaveBeenCalled();
  });

  // --- Slide Content ---

  it("renders the first slide title", () => {
    render(<HeroSlideshow />);
    expect(screen.getByText("Welcome to RNHT")).toBeInTheDocument();
  });

  it("renders the first slide subtitle", () => {
    render(<HeroSlideshow />);
    expect(screen.getByText("A sacred space for all")).toBeInTheDocument();
  });

  it("renders all slides in the DOM", () => {
    render(<HeroSlideshow />);
    const slides = getAllSlides();
    expect(slides).toHaveLength(3);
  });

  it("marks slides with correct aria-roledescription", () => {
    render(<HeroSlideshow />);
    const slides = getAllSlides();
    slides.forEach((slide) => {
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    });
  });

  it("labels each slide with its position", () => {
    render(<HeroSlideshow />);
    const slides = getAllSlides();
    // RN-117: slide aria-label is enriched with "title — subtitle" so screen
    // readers announce the slide's position AND its content.
    expect(slides[0]).toHaveAttribute(
      "aria-label",
      "Slide 1 of 3: Welcome to RNHT — A sacred space for all"
    );
    expect(slides[1]).toHaveAttribute(
      "aria-label",
      "Slide 2 of 3: Divine Services — Traditional Vedic ceremonies"
    );
    expect(slides[2]).toHaveAttribute(
      "aria-label",
      "Slide 3 of 3: Temple Tour — Explore our temple"
    );
  });

  it("hides non-active slides with aria-hidden", () => {
    render(<HeroSlideshow />);
    const slides = getAllSlides();
    // Current slide (index 0): aria-hidden="false"
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides[2]).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the Sanskrit quote text", () => {
    render(<HeroSlideshow />);
    const quotes = document.querySelectorAll("p");
    const dharmQuote = Array.from(quotes).find((p) =>
      p.textContent?.includes("DHARMO RAKSHATI RAKSHITAHA")
    );
    expect(dharmQuote).toBeTruthy();
  });

  // --- Navigation Controls ---

  it("renders previous and next slide buttons", () => {
    render(<HeroSlideshow />);
    expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
    expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
  });

  it("navigates to the next slide when the next button is clicked", () => {
    render(<HeroSlideshow />);
    fireEvent.click(screen.getByLabelText("Next slide"));
    const slides = getAllSlides();
    // Slide 2 should now be active (no aria-hidden)
    expect(slides[1]).toHaveAttribute("aria-hidden", "false");
    // Slide 1 should now be hidden
    expect(slides[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("navigates to the previous slide when the previous button is clicked", () => {
    render(<HeroSlideshow />);
    // Go next first
    fireEvent.click(screen.getByLabelText("Next slide"));
    // Wait for transition guard to clear
    act(() => {
      vi.advanceTimersByTime(600);
    });
    // Go back
    fireEvent.click(screen.getByLabelText("Previous slide"));
    const slides = getAllSlides();
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
  });

  it("wraps around to the first slide when navigating past the last", () => {
    render(<HeroSlideshow />);
    // Click next 3 times (with transition delays)
    fireEvent.click(screen.getByLabelText("Next slide"));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.click(screen.getByLabelText("Next slide"));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.click(screen.getByLabelText("Next slide"));

    const slides = getAllSlides();
    expect(slides[0]).toHaveAttribute("aria-hidden", "false");
  });

  it("wraps around to the last slide when navigating before the first", () => {
    render(<HeroSlideshow />);
    fireEvent.click(screen.getByLabelText("Previous slide"));
    const slides = getAllSlides();
    expect(slides[2]).toHaveAttribute("aria-hidden", "false");
  });

  // --- Dot Navigation ---

  it("renders navigation dots for each slide", () => {
    render(<HeroSlideshow />);
    const dots = screen.getAllByLabelText(/Go to slide/);
    expect(dots).toHaveLength(3);
  });

  it("highlights the active dot", () => {
    render(<HeroSlideshow />);
    const dot1 = screen.getByLabelText("Go to slide 1");
    expect(dot1.className).toContain("w-8");
    expect(dot1.className).toContain("bg-temple-gold");
  });

  it("sets aria-current on the active dot", () => {
    render(<HeroSlideshow />);
    const dot1 = screen.getByLabelText("Go to slide 1");
    expect(dot1).toHaveAttribute("aria-current", "true");

    const dot2 = screen.getByLabelText("Go to slide 2");
    expect(dot2).not.toHaveAttribute("aria-current");
  });

  it("navigates to a specific slide when a dot is clicked", () => {
    render(<HeroSlideshow />);
    fireEvent.click(screen.getByLabelText("Go to slide 3"));

    const slides = getAllSlides();
    expect(slides[2]).toHaveAttribute("aria-hidden", "false");
  });

  // --- Pause/Play ---

  it("renders the pause button by default", () => {
    render(<HeroSlideshow />);
    expect(screen.getByLabelText("Pause slideshow")).toBeInTheDocument();
  });

  it("toggles to play button when pause is clicked", () => {
    render(<HeroSlideshow />);
    fireEvent.click(screen.getByLabelText("Pause slideshow"));
    expect(screen.getByLabelText("Resume slideshow")).toBeInTheDocument();
  });

  it("toggles back to pause button when play is clicked", () => {
    render(<HeroSlideshow />);
    fireEvent.click(screen.getByLabelText("Pause slideshow"));
    fireEvent.click(screen.getByLabelText("Resume slideshow"));
    expect(screen.getByLabelText("Pause slideshow")).toBeInTheDocument();
  });

  // --- Auto-play ---

  it("auto-advances slides after 6 seconds", () => {
    render(<HeroSlideshow />);
    // Initially on slide 1
    expect(screen.getByLabelText("Go to slide 1")).toHaveAttribute(
      "aria-current",
      "true"
    );

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Should move to slide 2
    expect(screen.getByLabelText("Go to slide 2")).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  it("does not auto-advance when paused", () => {
    render(<HeroSlideshow />);
    fireEvent.click(screen.getByLabelText("Pause slideshow"));

    act(() => {
      vi.advanceTimersByTime(12000);
    });

    // Should still be on slide 1
    expect(screen.getByLabelText("Go to slide 1")).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  // --- Transition Guard ---

  it("prevents rapid navigation clicks (transition guard)", () => {
    render(<HeroSlideshow />);
    // Click next twice rapidly without waiting for transition
    fireEvent.click(screen.getByLabelText("Next slide"));
    fireEvent.click(screen.getByLabelText("Next slide"));

    // Second click should be ignored due to isTransitioning guard
    // Should only advance one slide
    const slides = getAllSlides();
    expect(slides[1]).toHaveAttribute("aria-hidden", "false");
  });

  // --- Video Slide ---

  it("renders a video element for video slides", () => {
    render(<HeroSlideshow />);
    // All slides are in the DOM; video slide (index 2) always renders <video>
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "https://example.com/video.mp4");
  });

  // --- Image Slide Background ---

  it("renders background image for image slides", () => {
    render(<HeroSlideshow />);
    // jsdom may serialize the style differently, so check for the URL in any style attribute
    const allDivs = document.querySelectorAll("[style]");
    const bgDiv = Array.from(allDivs).find((el) =>
      el.getAttribute("style")?.includes("example.com/img1.jpg")
    );
    expect(bgDiv).not.toBeNull();
  });

  // --- Panchangam Scroll ---

  it("renders the Panchangam scroll link", () => {
    render(<HeroSlideshow />);
    const panchangamLink = document.querySelector('a[href="/panchangam"]');
    expect(panchangamLink).not.toBeNull();
  });

  it("displays Panchangam title text", () => {
    render(<HeroSlideshow />);
    expect(screen.getByText("Panchangam")).toBeInTheDocument();
  });

  it("displays View Full Details CTA", () => {
    render(<HeroSlideshow />);
    expect(screen.getByText(/View Full Details/)).toBeInTheDocument();
  });

  it("displays panchangam data fields", () => {
    render(<HeroSlideshow />);
    expect(screen.getByText("Day:")).toBeInTheDocument();
    expect(screen.getByText("Masa:")).toBeInTheDocument();
    expect(screen.getByText("Tithi:")).toBeInTheDocument();
    expect(screen.getByText("Nakshatra:")).toBeInTheDocument();
    expect(screen.getByText("Karana:")).toBeInTheDocument();
    expect(screen.getByText("Yoga:")).toBeInTheDocument();
    expect(screen.getByText("Sunrise / Sunset:")).toBeInTheDocument();
    expect(screen.getByText("Rahu Kalam:")).toBeInTheDocument();
  });
});

describe("HeroSlideshow with no active slides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSlideshowState = { slides: [], loading: false, fetchSlides: vi.fn() };
  });

  it("renders fallback content when there are no active slides", () => {
    render(<HeroSlideshow />);
    expect(
      screen.getByText("Rudra Narayana Hindu Temple")
    ).toBeInTheDocument();
  });

  it("does not render navigation controls with no slides", () => {
    render(<HeroSlideshow />);
    expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Pause slideshow")
    ).not.toBeInTheDocument();
  });
});

describe("HeroSlideshow with single slide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSlideshowState = {
      slides: [
        {
          id: "1",
          type: "image",
          url: "https://example.com/img.jpg",
          title: "Single Slide",
          subtitle: "Only one",
          ctaText: "",
          ctaLink: "",
          isActive: true,
          showText: true,
          sortOrder: 0,
        },
      ],
      loading: false,
      fetchSlides: vi.fn(),
    };
  });

  it("does not render navigation controls with a single slide", () => {
    render(<HeroSlideshow />);
    expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument();
  });
});

describe("HeroSlideshow with showText false", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSlideshowState = {
      slides: [
        {
          id: "1",
          type: "image",
          url: "https://example.com/img.jpg",
          title: "Hidden Title",
          subtitle: "Hidden Subtitle",
          ctaText: "",
          ctaLink: "",
          isActive: true,
          showText: false,
          sortOrder: 0,
        },
      ],
      loading: false,
      fetchSlides: vi.fn(),
    };
  });

  it("does not render text overlay when showText is false", () => {
    render(<HeroSlideshow />);
    expect(screen.queryByText("Hidden Title")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden Subtitle")).not.toBeInTheDocument();
  });
});

describe("HeroSlideshow with no URL (gradient fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSlideshowState = {
      slides: [
        {
          id: "1",
          type: "image",
          url: "",
          title: "Gradient Slide",
          subtitle: "No image",
          ctaText: "",
          ctaLink: "",
          isActive: true,
          showText: true,
          sortOrder: 0,
        },
        {
          id: "2",
          type: "image",
          url: "",
          title: "Gradient Slide 2",
          subtitle: "Also no image",
          ctaText: "",
          ctaLink: "",
          isActive: true,
          showText: true,
          sortOrder: 1,
        },
      ],
      loading: false,
      fetchSlides: vi.fn(),
    };
  });

  it("renders a gradient background when slide has no URL", () => {
    render(<HeroSlideshow />);
    expect(screen.getByText("Gradient Slide")).toBeInTheDocument();
    // Should have a gradient background div
    const gradientDiv = document.querySelector('[class*="bg-gradient-to-br"]');
    expect(gradientDiv).not.toBeNull();
  });
});
