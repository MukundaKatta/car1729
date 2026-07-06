import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServiceCard } from "@/components/services/ServiceCard";
import type { Service } from "@/types/database";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => ({ data: null }) }) }),
    }),
  },
}));

vi.mock("@/store/panditji", () => ({
  usePanditjiWhatsApp: () => "https://wa.me/15125450473",
}));

// The modal is rendered by ServiceCard on click — mock it as a dumb div so
// we don't pull in its own tests here.
vi.mock("@/components/services/ServiceDetailModal", () => ({
  ServiceDetailModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Service detail modal">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: "svc-1",
    category_id: "cat-2",
    name: "Ganapathi Homam",
    slug: "ganapathi-homam",
    short_description: "Offering to Lord Ganesha for obstacle removal",
    full_description: null,
    significance: null,
    items_to_bring: null,
    whats_included: null,
    image_url: null,
    price: null,
    price_type: "custom",
    price_tiers: null,
    suggested_donation: null,
    duration_minutes: 60,
    location_type: "at_temple",
    is_active: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Service;
}

describe("ServiceCard", () => {
  it("renders the service name and short description", () => {
    render(<ServiceCard service={makeService()} />);
    expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
    expect(
      screen.getByText("Offering to Lord Ganesha for obstacle removal")
    ).toBeInTheDocument();
  });

  it("exposes a WhatsApp CTA with a prefilled link", () => {
    render(<ServiceCard service={makeService()} />);
    const cta = screen.getByRole("link", {
      name: /message about ganapathi homam on whatsapp/i,
    });
    expect(cta.getAttribute("href")).toContain("https://wa.me/15125450473");
    // Prefilled message contains the service name (URL-encoded)
    expect(cta.getAttribute("href")).toContain("Ganapathi%20Homam");
  });

  it("exposes a Call CTA linking to the temple phone", () => {
    render(<ServiceCard service={makeService()} />);
    const cta = screen.getByRole("link", {
      name: /call the temple about ganapathi homam/i,
    });
    expect(cta.getAttribute("href")).toBe("tel:+15125450473");
  });

  it("opens the detail modal when the card is clicked", () => {
    render(<ServiceCard service={makeService()} />);
    // The card exposes "View details" buttons (image overlay + card body); either
    // opens the modal. Click the first.
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /view details for ganapathi homam/i,
      })[0]
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a category icon when the service has no image", () => {
    // A slug that matches no gallery and no category-fallback keyword falls
    // through to the category-icon placeholder.
    render(
      <ServiceCard
        service={makeService({
          category_id: "cat-1",
          slug: "special-blessing",
          name: "Special Blessing",
        })}
      />
    );
    // Each category maps to an emoji; cat-1 defaults to 🙏
    expect(screen.getByText("🙏")).toBeInTheDocument();
  });

  it("does not render any pricing, duration, or location information", () => {
    render(<ServiceCard service={makeService()} />);
    // These used to be visible on the old card and have been intentionally
    // removed. Guard against regressions.
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\b\d+\s*min\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/At Temple/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Outside Temple/i)).not.toBeInTheDocument();
  });
});
