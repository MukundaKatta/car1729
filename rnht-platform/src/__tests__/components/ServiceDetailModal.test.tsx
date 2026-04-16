import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import type { Service } from "@/types/database";

vi.mock("@/store/panditji", () => ({
  usePanditjiWhatsApp: () => "https://wa.me/15125450473",
}));

const makeService = (overrides: Partial<Service> = {}): Service => ({
  id: "svc-1",
  category_id: "cat-1",
  name: "Ganapathi Homam",
  slug: "ganapathi-homam",
  short_description: "Invoke blessings",
  full_description: "A detailed homam ceremony",
  significance: "Removes obstacles",
  items_to_bring: ["Flowers"],
  whats_included: ["Prasadam"],
  image_url: null,
  price: 151,
  price_type: "fixed",
  price_tiers: null,
  suggested_donation: null,
  duration_minutes: 60,
  location_type: "at_temple",
  is_active: true,
  sort_order: 1,
  created_at: "",
  updated_at: "",
  ...overrides,
});

describe("ServiceDetailModal", () => {
  it("renders the service information dialog", () => {
    render(<ServiceDetailModal service={makeService()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
    expect(screen.getByText("A detailed homam ceremony")).toBeInTheDocument();
    expect(screen.getByText("Spiritual Significance")).toBeInTheDocument();
  });

  it("renders the panditji contact actions", () => {
    render(<ServiceDetailModal service={makeService()} onClose={vi.fn()} />);
    expect(screen.getByText("WhatsApp Panditji").closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/15125450473?text=")
    );
    expect(screen.getByText("Call (512) 545-0473").closest("a")).toHaveAttribute(
      "href",
      "tel:+15125450473"
    );
  });

  it("falls back to the short description when full description is missing", () => {
    render(
      <ServiceDetailModal
        service={makeService({ full_description: null, short_description: "Short only" })}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Short only")).toBeInTheDocument();
  });
});
