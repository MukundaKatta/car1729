import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import type { Service } from "@/types/database";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
  Clock: (props: any) => <svg data-testid="clock-icon" {...props} />,
  MapPin: (props: any) => <svg data-testid="map-icon" {...props} />,
  CheckCircle: (props: any) => <svg data-testid="check-icon" {...props} />,
  AlertCircle: (props: any) => <svg data-testid="alert-icon" {...props} />,
  MessageCircle: (props: any) => <svg data-testid="message-icon" {...props} />,
  Phone: (props: any) => <svg data-testid="phone-icon" {...props} />,
}));

const mockAddItem = vi.fn();

// Mock cart store
vi.mock("@/store/cart", () => ({
  useCartStore: vi.fn((selector: any) =>
    selector({
      items: [],
      addItem: mockAddItem,
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      getTotal: () => 0,
      getItemCount: () => 0,
    })
  ),
}));

const makeService = (overrides: Partial<Service> = {}): Service => ({
  id: "svc-1",
  category_id: "cat-homam",
  name: "Ganapathi Homam",
  slug: "ganapathi-homam",
  short_description: "Invoke blessings for new beginnings",
  full_description: "A detailed homam ceremony invoking Lord Ganesha",
  significance: "Removes obstacles from your path",
  items_to_bring: ["Flowers", "Fruits"],
  whats_included: ["Pooja materials", "Prasadam"],
  image_url: null,
  price: 151,
  price_type: "fixed",
  price_tiers: null,
  suggested_donation: null,
  duration_minutes: 60,
  location_type: "at_temple",
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("ServiceDetailModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with dialog role and aria attributes", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("renders the service name as modal title", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("Ganapathi Homam")).toBeInTheDocument();
    expect(screen.getByText("Ganapathi Homam").id).toBe("modal-title");
  });

  it("renders the full description", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("A detailed homam ceremony invoking Lord Ganesha")).toBeInTheDocument();
  });

  it("falls back to short_description when full_description is null", () => {
    render(
      <ServiceDetailModal
        service={makeService({ full_description: null })}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Invoke blessings for new beginnings")).toBeInTheDocument();
  });

  it("displays duration in minutes", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("60 minutes")).toBeInTheDocument();
  });

  it("displays 'At Temple' location label", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("At Temple")).toBeInTheDocument();
  });

  it("displays 'Outside Temple' for outside_temple location", () => {
    render(
      <ServiceDetailModal
        service={makeService({ location_type: "outside_temple" })}
        onClose={onClose}
      />
    );
    expect(screen.getByText("Outside Temple")).toBeInTheDocument();
  });

  it("displays 'At Temple / Outside' for both location", () => {
    render(
      <ServiceDetailModal
        service={makeService({ location_type: "both" })}
        onClose={onClose}
      />
    );
    expect(screen.getByText("At Temple / Outside")).toBeInTheDocument();
  });

  it("renders spiritual significance section", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("Spiritual Significance")).toBeInTheDocument();
    expect(screen.getByText("Removes obstacles from your path")).toBeInTheDocument();
  });

  it("does not render significance section when null", () => {
    render(
      <ServiceDetailModal
        service={makeService({ significance: null })}
        onClose={onClose}
      />
    );
    expect(screen.queryByText("Spiritual Significance")).not.toBeInTheDocument();
  });

  it("renders whats_included list", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("Pooja materials")).toBeInTheDocument();
    expect(screen.getByText("Prasadam")).toBeInTheDocument();
  });

  it("does not render whats_included when null", () => {
    render(
      <ServiceDetailModal
        service={makeService({ whats_included: null })}
        onClose={onClose}
      />
    );
    expect(screen.queryByText("What's Included")).not.toBeInTheDocument();
  });

  it("renders items_to_bring list", () => {
    render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
    expect(screen.getByText("Flowers")).toBeInTheDocument();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
  });

  it("does not render items_to_bring when null", () => {
    render(
      <ServiceDetailModal
        service={makeService({ items_to_bring: null })}
        onClose={onClose}
      />
    );
    expect(screen.queryByText("Items to Bring (Pooja Checklist)")).not.toBeInTheDocument();
  });

  describe("Pricing display", () => {
    it("shows fixed price", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      expect(screen.getByText("$151.00")).toBeInTheDocument();
    });

    it("shows tiered pricing with radio buttons", () => {
      const service = makeService({
        price_type: "tiered",
        price: null,
        price_tiers: [
          { name: "Basic", price: 51, description: "Simple ceremony" },
          { name: "Premium", price: 151, description: "Full ceremony" },
        ],
      });
      render(<ServiceDetailModal service={service} onClose={onClose} />);
      expect(screen.getByText("Basic")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText("$51.00")).toBeInTheDocument();
      expect(screen.getByText("$151.00")).toBeInTheDocument();
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBe(2);
      expect(radios[0]).toBeChecked();
    });

    it("allows selecting a different tier", () => {
      const service = makeService({
        price_type: "tiered",
        price: null,
        price_tiers: [
          { name: "Basic", price: 51, description: "Simple ceremony" },
          { name: "Premium", price: 151, description: "Full ceremony" },
        ],
      });
      render(<ServiceDetailModal service={service} onClose={onClose} />);
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);
      expect(radios[1]).toBeChecked();
    });

    it("shows donation-based pricing", () => {
      render(
        <ServiceDetailModal
          service={makeService({
            price_type: "donation",
            price: null,
            suggested_donation: 21,
          })}
          onClose={onClose}
        />
      );
      expect(screen.getByText(/donation basis/)).toBeInTheDocument();
      expect(screen.getByText(/\$21\.00/)).toBeInTheDocument();
    });

    it("shows donation-based pricing without suggested donation", () => {
      render(
        <ServiceDetailModal
          service={makeService({
            price_type: "donation",
            price: null,
            suggested_donation: null,
          })}
          onClose={onClose}
        />
      );
      expect(screen.getByText(/donation basis/)).toBeInTheDocument();
      expect(screen.queryByText(/Suggested donation/)).not.toBeInTheDocument();
    });

    it("shows custom pricing message", () => {
      render(
        <ServiceDetailModal
          service={makeService({ price_type: "custom", price: null })}
          onClose={onClose}
        />
      );
      const matches = screen.getAllByText(/custom quote/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Close behavior", () => {
    it("calls onClose when close button is clicked", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      const closeBtn = screen.getByLabelText("Close dialog");
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape key is pressed", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop is clicked", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      const backdrop = screen.getByRole("dialog");
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when modal content is clicked", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Ganapathi Homam"));
      expect(onClose).not.toHaveBeenCalled();
    });

    it("locks body scroll on mount", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("WhatsApp and Phone links", () => {
    it("renders WhatsApp booking link", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      expect(screen.getByText("WhatsApp Pt. Aditya")).toBeInTheDocument();
      const link = screen.getByText("WhatsApp Pt. Aditya").closest("a");
      expect(link).toHaveAttribute("href");
      expect(link?.getAttribute("href")).toContain("wa.me");
    });

    it("renders phone call link", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      expect(screen.getByText("Call Pt. Raghurama")).toBeInTheDocument();
      const link = screen.getByText("Call Pt. Raghurama").closest("a");
      expect(link).toHaveAttribute("href", "tel:+15129980122");
    });
  });

  describe("Booking form", () => {
    it("shows 'Or Book Online' button for non-custom services", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      expect(screen.getByText("Or Book Online")).toBeInTheDocument();
    });

    it("does not show 'Or Book Online' for custom price services", () => {
      render(
        <ServiceDetailModal
          service={makeService({ price_type: "custom", price: null })}
          onClose={onClose}
        />
      );
      expect(screen.queryByText("Or Book Online")).not.toBeInTheDocument();
      const matches = screen.getAllByText(/custom quote/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it("shows custom quote contact note for custom services", () => {
      render(
        <ServiceDetailModal
          service={makeService({ price_type: "custom", price: null })}
          onClose={onClose}
        />
      );
      expect(screen.getByText(/Please contact us via WhatsApp or phone above/)).toBeInTheDocument();
    });

    it("reveals booking form when 'Or Book Online' is clicked", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      expect(screen.getByText("Booking Details")).toBeInTheDocument();
      expect(screen.getByText("Preferred Date *")).toBeInTheDocument();
      expect(screen.getByText("Preferred Time *")).toBeInTheDocument();
      expect(screen.getByText("Devotee Name *")).toBeInTheDocument();
      expect(screen.getByText("Email *")).toBeInTheDocument();
    });

    it("renders all booking form fields", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("(555) 123-4567")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., Bharadwaja")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., Ashwini")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g., Mesha")).toBeInTheDocument();
    });

    it("Add to Cart button is disabled when required fields are empty", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const addButton = screen.getByText("Add to Cart");
      expect(addButton).toBeDisabled();
    });

    it("Add to Cart button is enabled when required fields are filled", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: "2026-04-01" } });

      const timeSelect = screen.getByDisplayValue("Select a time");
      fireEvent.change(timeSelect, { target: { value: "09:00" } });

      const nameInput = screen.getByPlaceholderText("Full name");
      fireEvent.change(nameInput, { target: { value: "John Doe" } });

      const emailInput = screen.getByPlaceholderText("your@email.com");
      fireEvent.change(emailInput, { target: { value: "john@example.com" } });

      const addButton = screen.getByText("Add to Cart");
      expect(addButton).not.toBeDisabled();
    });

    it("calls addItem and shows confirmation when Add to Cart is clicked", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: "2026-04-01" } });

      const timeSelect = screen.getByDisplayValue("Select a time");
      fireEvent.change(timeSelect, { target: { value: "09:00" } });

      fireEvent.change(screen.getByPlaceholderText("Full name"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
        target: { value: "john@example.com" },
      });

      fireEvent.click(screen.getByText("Add to Cart"));

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Added to Cart!")).toBeInTheDocument();
      expect(screen.getByText("Ganapathi Homam has been added to your cart.")).toBeInTheDocument();
    });

    it("calls onClose after adding to cart (after timeout)", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByDisplayValue("Select a time"), { target: { value: "09:00" } });
      fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "John" } });
      fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: "j@e.com" } });

      fireEvent.click(screen.getByText("Add to Cart"));

      expect(onClose).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("passes all form fields to addItem including phone, gotra, nakshatra, rashi, specialInstructions", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      // Required fields
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: "2026-05-15" } });
      fireEvent.change(screen.getByDisplayValue("Select a time"), { target: { value: "10:00" } });
      fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "Rama Krishnan" } });
      fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: "rama@example.com" } });

      // Optional fields
      fireEvent.change(screen.getByPlaceholderText("(555) 123-4567"), { target: { value: "5121234567" } });
      fireEvent.change(screen.getByPlaceholderText("e.g., Bharadwaja"), { target: { value: "Bharadwaja" } });
      fireEvent.change(screen.getByPlaceholderText("e.g., Ashwini"), { target: { value: "Ashwini" } });
      fireEvent.change(screen.getByPlaceholderText("e.g., Mesha"), { target: { value: "Mesha" } });
      fireEvent.change(screen.getByPlaceholderText("Any special requests or notes for the priest..."), {
        target: { value: "Please use fresh flowers" },
      });

      fireEvent.click(screen.getByText("Add to Cart"));

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      const item = mockAddItem.mock.calls[0][0];
      expect(item.bookingDate).toBe("2026-05-15");
      expect(item.bookingTime).toBe("10:00");
      expect(item.devoteeName).toBe("Rama Krishnan");
      expect(item.devoteeEmail).toBe("rama@example.com");
      expect(item.devoteePhone).toBe("5121234567");
      expect(item.gotra).toBe("Bharadwaja");
      expect(item.nakshatra).toBe("Ashwini");
      expect(item.rashi).toBe("Mesha");
      expect(item.specialInstructions).toBe("Please use fresh flowers");
      expect(item.familyMembers).toEqual([]);
      expect(item.quantity).toBe(1);
      expect(item.service.id).toBe("svc-1");
    });

    it("passes family members to addItem when adding to cart", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      // Add a family member
      fireEvent.click(screen.getByText("+ Add Member"));

      // Fill family member fields
      fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Lakshmi" } });
      fireEvent.change(screen.getByPlaceholderText("Relationship"), { target: { value: "Spouse" } });
      // Family member gotra placeholder
      const gotraInputs = screen.getAllByPlaceholderText("Gotra");
      fireEvent.change(gotraInputs[0], { target: { value: "Kashyapa" } });
      // Family member nakshatra placeholder
      const nakshatraInputs = screen.getAllByPlaceholderText("Nakshatra");
      fireEvent.change(nakshatraInputs[0], { target: { value: "Rohini" } });

      // Fill required fields
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByDisplayValue("Select a time"), { target: { value: "09:00" } });
      fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "John" } });
      fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: "j@e.com" } });

      fireEvent.click(screen.getByText("Add to Cart"));

      const item = mockAddItem.mock.calls[0][0];
      expect(item.familyMembers).toHaveLength(1);
      expect(item.familyMembers[0].name).toBe("Lakshmi");
      expect(item.familyMembers[0].relationship).toBe("Spouse");
      expect(item.familyMembers[0].gotra).toBe("Kashyapa");
      expect(item.familyMembers[0].nakshatra).toBe("Rohini");
    });

    it("passes selectedTier to addItem for tiered services", () => {
      const service = makeService({
        price_type: "tiered",
        price: null,
        price_tiers: [
          { name: "Basic", price: 51, description: "Simple ceremony" },
          { name: "Premium", price: 151, description: "Full ceremony" },
        ],
      });
      render(<ServiceDetailModal service={service} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      // Select premium tier
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[1]);

      // Fill required fields
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: "2026-04-01" } });
      fireEvent.change(screen.getByDisplayValue("Select a time"), { target: { value: "09:00" } });
      fireEvent.change(screen.getByPlaceholderText("Full name"), { target: { value: "John" } });
      fireEvent.change(screen.getByPlaceholderText("your@email.com"), { target: { value: "j@e.com" } });

      fireEvent.click(screen.getByText("Add to Cart"));

      const item = mockAddItem.mock.calls[0][0];
      expect(item.selectedTier).toEqual({ name: "Premium", price: 151, description: "Full ceremony" });
    });
  });

  describe("Family members", () => {
    function openBookingForm() {
      fireEvent.click(screen.getByText("Or Book Online"));
    }

    it("renders Add Member button", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      expect(screen.getByText("+ Add Member")).toBeInTheDocument();
    });

    it("adds a family member row when Add Member is clicked", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      fireEvent.click(screen.getByText("+ Add Member"));
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Relationship")).toBeInTheDocument();
    });

    it("adds multiple family members", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      fireEvent.click(screen.getByText("+ Add Member"));
      fireEvent.click(screen.getByText("+ Add Member"));
      const nameInputs = screen.getAllByPlaceholderText("Name");
      expect(nameInputs.length).toBe(2);
    });

    it("removes a family member", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      fireEvent.click(screen.getByText("+ Add Member"));
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();

      const removeBtn = screen.getByLabelText("Remove family member");
      fireEvent.click(removeBtn);
      expect(screen.queryByPlaceholderText("Name")).not.toBeInTheDocument();
    });

    it("updates family member fields", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      fireEvent.click(screen.getByText("+ Add Member"));

      const nameInput = screen.getByPlaceholderText("Name");
      fireEvent.change(nameInput, { target: { value: "Lakshmi" } });
      expect(nameInput).toHaveValue("Lakshmi");

      const relInput = screen.getByPlaceholderText("Relationship");
      fireEvent.change(relInput, { target: { value: "Spouse" } });
      expect(relInput).toHaveValue("Spouse");
    });

    it("updates family member gotra and nakshatra fields", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      fireEvent.click(screen.getByText("+ Add Member"));

      const gotraInputs = screen.getAllByPlaceholderText("Gotra");
      fireEvent.change(gotraInputs[0], { target: { value: "Kashyapa" } });
      expect(gotraInputs[0]).toHaveValue("Kashyapa");

      const nakshatraInputs = screen.getAllByPlaceholderText("Nakshatra");
      fireEvent.change(nakshatraInputs[0], { target: { value: "Rohini" } });
      expect(nakshatraInputs[0]).toHaveValue("Rohini");
    });

    it("removes the correct family member from multiple", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      openBookingForm();
      fireEvent.click(screen.getByText("+ Add Member"));
      fireEvent.click(screen.getByText("+ Add Member"));

      const nameInputs = screen.getAllByPlaceholderText("Name");
      fireEvent.change(nameInputs[0], { target: { value: "First" } });
      fireEvent.change(nameInputs[1], { target: { value: "Second" } });

      // Remove the first member
      const removeBtns = screen.getAllByLabelText("Remove family member");
      fireEvent.click(removeBtns[0]);

      const remaining = screen.getAllByPlaceholderText("Name");
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toHaveValue("Second");
    });
  });

  describe("Time select options", () => {
    it("renders all time slot options", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));

      expect(screen.getByText("Select a time")).toBeInTheDocument();
      expect(screen.getByText("9:00 AM")).toBeInTheDocument();
      expect(screen.getByText("10:00 AM")).toBeInTheDocument();
      expect(screen.getByText("11:00 AM")).toBeInTheDocument();
      expect(screen.getByText("5:00 PM")).toBeInTheDocument();
      expect(screen.getByText("6:00 PM")).toBeInTheDocument();
      expect(screen.getByText("7:00 PM")).toBeInTheDocument();
    });
  });

  describe("Special instructions", () => {
    it("renders special instructions textarea", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const textarea = screen.getByPlaceholderText("Any special requests or notes for the priest...");
      expect(textarea).toBeInTheDocument();
    });

    it("updates special instructions value", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const textarea = screen.getByPlaceholderText("Any special requests or notes for the priest...");
      fireEvent.change(textarea, { target: { value: "Please use organic flowers" } });
      expect(textarea).toHaveValue("Please use organic flowers");
    });
  });

  describe("Empty lists", () => {
    it("does not render whats_included when array is empty", () => {
      render(
        <ServiceDetailModal
          service={makeService({ whats_included: [] })}
          onClose={onClose}
        />
      );
      expect(screen.queryByText("What's Included")).not.toBeInTheDocument();
    });

    it("does not render items_to_bring when array is empty", () => {
      render(
        <ServiceDetailModal
          service={makeService({ items_to_bring: [] })}
          onClose={onClose}
        />
      );
      expect(screen.queryByText("Items to Bring (Pooja Checklist)")).not.toBeInTheDocument();
    });
  });

  describe("Phone field update", () => {
    it("updates phone field value", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const phoneInput = screen.getByPlaceholderText("(555) 123-4567");
      fireEvent.change(phoneInput, { target: { value: "5125550123" } });
      expect(phoneInput).toHaveValue("5125550123");
    });
  });

  describe("Gotra/Nakshatra/Rashi field updates", () => {
    it("updates gotra field value", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const input = screen.getByPlaceholderText("e.g., Bharadwaja");
      fireEvent.change(input, { target: { value: "Vishwamitra" } });
      expect(input).toHaveValue("Vishwamitra");
    });

    it("updates nakshatra field value", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const input = screen.getByPlaceholderText("e.g., Ashwini");
      fireEvent.change(input, { target: { value: "Mrigashira" } });
      expect(input).toHaveValue("Mrigashira");
    });

    it("updates rashi field value", () => {
      render(<ServiceDetailModal service={makeService()} onClose={onClose} />);
      fireEvent.click(screen.getByText("Or Book Online"));
      const input = screen.getByPlaceholderText("e.g., Mesha");
      fireEvent.change(input, { target: { value: "Vrishabha" } });
      expect(input).toHaveValue("Vrishabha");
    });
  });
});
