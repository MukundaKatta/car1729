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
  usePathname: () => "/admin/services",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({}),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
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
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/img.jpg" },
        }),
      }),
    },
  },
}));
vi.mock("@/store/cart", () => ({
  useCartStore: (sel: any) => {
    const s = {
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      getTotal: () => 0,
      getItemCount: () => 0,
    };
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
    const s = {
      isAuthenticated: false,
      user: null,
      authUser: null,
      bookings: [],
      donations: [],
      activities: [],
      loading: false,
      initialized: true,
      initialize: vi.fn(),
      sendOtp: vi.fn().mockResolvedValue({}),
      verifyOtp: vi.fn().mockResolvedValue({}),
      logout: vi.fn(),
      addDonation: vi.fn(),
      addBooking: vi.fn(),
      updateProfile: vi.fn(),
      addFamilyMember: vi.fn(),
      removeFamilyMember: vi.fn(),
      fetchUserData: vi.fn(),
    };
    return typeof sel === "function" ? sel(s) : s;
  },
}));
vi.mock("@/store/slideshow", () => ({
  useSlideshowStore: (sel: any) => {
    const s = {
      slides: [],
      loading: false,
      fetchSlides: vi.fn(),
      addSlide: vi.fn(),
      updateSlide: vi.fn(),
      removeSlide: vi.fn(),
      reorderSlides: vi.fn(),
    };
    return typeof sel === "function" ? sel(s) : s;
  },
}));

import AdminServicesPage from "@/app/admin/services/page";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("AdminServicesPage", () => {
  // --- Basic rendering ---

  it("renders without crashing", () => {
    render(<AdminServicesPage />);
    expect(screen.getByText("Manage Services")).toBeInTheDocument();
  });

  it("shows back to dashboard link pointing to /admin", () => {
    render(<AdminServicesPage />);
    const backLink = screen.getByText("Back to Dashboard");
    expect(backLink.closest("a")).toHaveAttribute("href", "/admin");
  });

  it("shows Add Service button", () => {
    render(<AdminServicesPage />);
    expect(screen.getByText("Add Service")).toBeInTheDocument();
  });

  it("shows table headers including Category", () => {
    render(<AdminServicesPage />);
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("displays services from sample data", () => {
    render(<AdminServicesPage />);
    expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();
    expect(screen.getByText("Punyaahavaachanam")).toBeInTheDocument();
    expect(screen.getByText("Namakaranam")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(27);
  });

  it("displays category names resolved from sample categories", () => {
    render(<AdminServicesPage />);
    // svc-1 has category_id "cat-2" -> "Pooja & Samskaras"
    const categoryLabels = screen.getAllByText("Pooja & Samskaras");
    expect(categoryLabels.length).toBeGreaterThanOrEqual(1);
    // svc-10 has category_id "cat-1" -> "Homam / Havan"
    const homamLabels = screen.getAllByText("Homam / Havan");
    expect(homamLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows duration in minutes in table", () => {
    render(<AdminServicesPage />);
    const minCells = screen.getAllByText(/\d+ min/);
    expect(minCells.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("45 min").length).toBeGreaterThanOrEqual(1);
  });

  it("displays price type labels correctly for custom services", () => {
    render(<AdminServicesPage />);
    // All sample services have price_type "custom", so all should show "Custom"
    const customLabels = screen.getAllByText("Custom");
    expect(customLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Active status for active services", () => {
    render(<AdminServicesPage />);
    const activeButtons = screen.getAllByText("Active");
    expect(activeButtons.length).toBeGreaterThanOrEqual(26);
  });

  // --- Toggle Active/Hidden ---

  it("toggles active status to Hidden when clicking Active button", () => {
    render(<AdminServicesPage />);
    const activeButtons = screen.getAllByText("Active");
    const count = activeButtons.length;
    fireEvent.click(activeButtons[0]);

    const newActiveButtons = screen.getAllByText("Active");
    expect(newActiveButtons.length).toBe(count - 1);
    const hiddenButtons = screen.getAllByText("Hidden");
    expect(hiddenButtons.length).toBe(1);
  });

  it("toggles Hidden back to Active", () => {
    render(<AdminServicesPage />);

    // First toggle to Hidden
    const activeButtons = screen.getAllByText("Active");
    const initialCount = activeButtons.length;
    fireEvent.click(activeButtons[0]);
    const hiddenButton = screen.getByText("Hidden");
    expect(hiddenButton).toBeInTheDocument();

    // Toggle back to Active
    fireEvent.click(hiddenButton);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    const allActive = screen.getAllByText("Active");
    expect(allActive.length).toBe(initialCount);
  });

  // --- Delete Service ---

  it("deletes a service when confirm returns true", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminServicesPage />);

    expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();
    const rowsBefore = screen.getAllByRole("row").length;

    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") && btn.className.includes("hover:bg-red-50")
      );
    });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this service?"
    );
    expect(
      screen.queryByText("Ganapathi Pooja")
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBe(rowsBefore - 1);

    confirmSpy.mockRestore();
  });

  it("does not delete a service when confirm returns false", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminServicesPage />);

    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") && btn.className.includes("hover:bg-red-50")
      );
    });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText("Ganapathi Pooja")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  // --- Add Service Modal ---

  it("opens add service modal when clicking Add Service", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("Add New Service")).toBeInTheDocument();
    expect(screen.getByText("Service Name *")).toBeInTheDocument();
    expect(screen.getByText("Category *")).toBeInTheDocument();
    expect(screen.getByText("Short Description *")).toBeInTheDocument();
  });

  it("shows price type, price, and duration fields in modal", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("Price Type")).toBeInTheDocument();
    expect(screen.getByText("Price ($)")).toBeInTheDocument();
    expect(screen.getByText("Duration (min)")).toBeInTheDocument();
  });

  it("shows location select in modal with three options", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("Location")).toBeInTheDocument();

    const locationSelect = screen.getByDisplayValue(
      "At Temple"
    ) as HTMLSelectElement;
    const options = locationSelect.querySelectorAll("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("At Temple");
    expect(options[1]).toHaveTextContent("Outside Temple");
    expect(options[2]).toHaveTextContent("Both");
  });

  it("shows price type select with all four options", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const priceTypeSelect = screen.getByDisplayValue(
      "Fixed"
    ) as HTMLSelectElement;
    const options = priceTypeSelect.querySelectorAll("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent("Fixed");
    expect(options[1]).toHaveTextContent("Tiered");
    expect(options[2]).toHaveTextContent("Custom Quote");
    expect(options[3]).toHaveTextContent("Donation");
  });

  it("shows category select with all sample categories", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const catSelect = screen.getByDisplayValue(
      "Homam / Havan"
    ) as HTMLSelectElement;
    const options = catSelect.querySelectorAll("option");
    expect(options).toHaveLength(6);
    expect(options[0]).toHaveTextContent("Homam / Havan");
    expect(options[1]).toHaveTextContent("Pooja & Samskaras");
  });

  it("closes modal when clicking Cancel", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("Add New Service")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Add New Service")).not.toBeInTheDocument();
  });

  it("disables submit when name and description are empty", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));
    const addBtns = screen.getAllByText("Add Service");
    const submitBtn = addBtns[addBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit when name and description are filled", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const nameInput = screen
      .getByText("Service Name *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(nameInput, { target: { value: "Test Service" } });

    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, {
      target: { value: "A test service description" },
    });

    const addBtns = screen.getAllByText("Add Service");
    const submitBtn = addBtns[addBtns.length - 1];
    expect(submitBtn).not.toBeDisabled();
  });

  it("fills in all form fields and saves a new service", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    // Fill name
    const nameInput = screen
      .getByText("Service Name *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(nameInput, { target: { value: "New Pooja Service" } });

    // Change category
    const catSelect = screen.getByDisplayValue(
      "Homam / Havan"
    ) as HTMLSelectElement;
    fireEvent.change(catSelect, { target: { value: "cat-3" } });

    // Fill short description
    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, {
      target: { value: "A brand new pooja service" },
    });

    // Change price type
    const priceTypeSelect = screen.getByDisplayValue(
      "Fixed"
    ) as HTMLSelectElement;
    fireEvent.change(priceTypeSelect, { target: { value: "donation" } });

    // Fill price
    const priceInput = screen
      .getByText("Price ($)")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(priceInput, { target: { value: "50" } });

    // Fill duration
    const durationInput = screen
      .getByText("Duration (min)")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(durationInput, { target: { value: "90" } });

    // Change location
    const locationSelect = screen.getByDisplayValue(
      "At Temple"
    ) as HTMLSelectElement;
    fireEvent.change(locationSelect, { target: { value: "outside_temple" } });

    // Submit
    const addBtns = screen.getAllByText("Add Service");
    fireEvent.click(addBtns[addBtns.length - 1]);

    // Modal should close
    expect(screen.queryByText("Add New Service")).not.toBeInTheDocument();

    // New service should appear in the table
    expect(screen.getByText("New Pooja Service")).toBeInTheDocument();
    expect(
      screen.getByText("A brand new pooja service")
    ).toBeInTheDocument();
  });

  // --- Edit Service Modal ---

  it("opens edit modal with pre-filled data when clicking edit button", () => {
    render(<AdminServicesPage />);

    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Edit Service")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    // First service is "Ganapathi Pooja"
    expect(screen.getByDisplayValue("Ganapathi Pooja")).toBeInTheDocument();
  });

  it("edit modal pre-fills short description", () => {
    render(<AdminServicesPage />);

    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    fireEvent.click(editButtons[0]);

    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    expect(descTextarea.value).toContain("Lord Ganesha");
  });

  it("edit modal pre-fills price type and location type", () => {
    render(<AdminServicesPage />);

    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    // svc-1 has price_type "custom" and location_type "both"
    fireEvent.click(editButtons[0]);

    const priceTypeSelect = screen.getByDisplayValue(
      "Custom Quote"
    ) as HTMLSelectElement;
    expect(priceTypeSelect.value).toBe("custom");

    const locationSelect = screen.getByDisplayValue(
      "Both"
    ) as HTMLSelectElement;
    expect(locationSelect.value).toBe("both");
  });

  it("edit modal pre-fills duration", () => {
    render(<AdminServicesPage />);

    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    // svc-1 has duration_minutes 60
    fireEvent.click(editButtons[0]);

    const durationInput = screen
      .getByText("Duration (min)")
      .closest("div")!
      .querySelector("input")!;
    expect(durationInput.value).toBe("60");
  });

  it("saves changes to an edited service", () => {
    render(<AdminServicesPage />);

    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    fireEvent.click(editButtons[0]);

    // Change the name
    const nameInput = screen.getByDisplayValue("Ganapathi Pooja");
    fireEvent.change(nameInput, {
      target: { value: "Ganapathi Pooja Updated" },
    });

    fireEvent.click(screen.getByText("Save Changes"));

    // Modal should close
    expect(screen.queryByText("Edit Service")).not.toBeInTheDocument();

    // Updated name should appear
    expect(
      screen.getByText("Ganapathi Pooja Updated")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Ganapathi Pooja")
    ).not.toBeInTheDocument();
  });

  // --- Price type changes ---

  it("changes price type selection in form", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const priceTypeSelect = screen.getByDisplayValue(
      "Fixed"
    ) as HTMLSelectElement;

    fireEvent.change(priceTypeSelect, { target: { value: "tiered" } });
    expect(priceTypeSelect.value).toBe("tiered");

    fireEvent.change(priceTypeSelect, { target: { value: "custom" } });
    expect(priceTypeSelect.value).toBe("custom");

    fireEvent.change(priceTypeSelect, { target: { value: "donation" } });
    expect(priceTypeSelect.value).toBe("donation");

    fireEvent.change(priceTypeSelect, { target: { value: "fixed" } });
    expect(priceTypeSelect.value).toBe("fixed");
  });

  // --- Location type changes ---

  it("changes location type selection in form", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const locationSelect = screen.getByDisplayValue(
      "At Temple"
    ) as HTMLSelectElement;

    fireEvent.change(locationSelect, { target: { value: "outside_temple" } });
    expect(locationSelect.value).toBe("outside_temple");

    fireEvent.change(locationSelect, { target: { value: "both" } });
    expect(locationSelect.value).toBe("both");

    fireEvent.change(locationSelect, { target: { value: "at_temple" } });
    expect(locationSelect.value).toBe("at_temple");
  });

  // --- Add Service resets editing state ---

  it("clicking Add Service after editing opens a blank form", () => {
    render(<AdminServicesPage />);

    // Open edit modal
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    fireEvent.click(editButtons[0]);
    expect(screen.getByText("Edit Service")).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByText("Cancel"));

    // Open add modal
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("Add New Service")).toBeInTheDocument();

    // Name should be empty
    const nameInput = screen
      .getByText("Service Name *")
      .closest("div")!
      .querySelector("input")!;
    expect(nameInput.value).toBe("");

    // Description should be empty
    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    expect(descTextarea.value).toBe("");
  });

  // --- Multiple operations ---

  it("can add a new service and then delete it", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminServicesPage />);

    // Add a new service
    fireEvent.click(screen.getByText("Add Service"));
    const nameInput = screen
      .getByText("Service Name *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(nameInput, { target: { value: "Temp Service" } });
    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, { target: { value: "Temporary" } });
    const addBtns = screen.getAllByText("Add Service");
    fireEvent.click(addBtns[addBtns.length - 1]);

    expect(screen.getByText("Temp Service")).toBeInTheDocument();

    // Delete the last service (the one we just added)
    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") && btn.className.includes("hover:bg-red-50")
      );
    });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(screen.queryByText("Temp Service")).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("newly added service with fixed price shows formatted currency", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const nameInput = screen
      .getByText("Service Name *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(nameInput, { target: { value: "Fixed Price Service" } });

    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, { target: { value: "Has a fixed price" } });

    // Set price type to fixed (already default)
    const priceInput = screen
      .getByText("Price ($)")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(priceInput, { target: { value: "125" } });

    const addBtns = screen.getAllByText("Add Service");
    fireEvent.click(addBtns[addBtns.length - 1]);

    // Should show $125.00
    expect(screen.getByText("$125.00")).toBeInTheDocument();
  });

  it("newly added service with donation price type shows Donation label", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const nameInput = screen
      .getByText("Service Name *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(nameInput, {
      target: { value: "Donation Based Service" },
    });

    const descTextarea = screen
      .getByText("Short Description *")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, {
      target: { value: "Donation based" },
    });

    const priceTypeSelect = screen.getByDisplayValue(
      "Fixed"
    ) as HTMLSelectElement;
    fireEvent.change(priceTypeSelect, { target: { value: "donation" } });

    const addBtns = screen.getAllByText("Add Service");
    fireEvent.click(addBtns[addBtns.length - 1]);

    expect(
      screen.getByText("Donation Based Service")
    ).toBeInTheDocument();
    // Should show "Donation" label in the price column
    const donationLabels = screen.getAllByText("Donation");
    expect(donationLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("edit modal pre-fills category selection", () => {
    render(<AdminServicesPage />);

    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return (
        btn.querySelector("svg") &&
        btn.className.includes("hover:bg-blue-50")
      );
    });
    // svc-1 has category_id "cat-2" -> "Pooja & Samskaras"
    fireEvent.click(editButtons[0]);

    const catSelect = screen.getByDisplayValue(
      "Pooja & Samskaras"
    ) as HTMLSelectElement;
    expect(catSelect.value).toBe("cat-2");
  });

  it("default duration in add form is 60", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const durationInput = screen
      .getByText("Duration (min)")
      .closest("div")!
      .querySelector("input")!;
    expect(durationInput.value).toBe("60");
  });

  it("default location in add form is at_temple", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const locationSelect = screen.getByDisplayValue(
      "At Temple"
    ) as HTMLSelectElement;
    expect(locationSelect.value).toBe("at_temple");
  });

  it("default price type in add form is fixed", () => {
    render(<AdminServicesPage />);
    fireEvent.click(screen.getByText("Add Service"));

    const priceTypeSelect = screen.getByDisplayValue(
      "Fixed"
    ) as HTMLSelectElement;
    expect(priceTypeSelect.value).toBe("fixed");
  });

  it("service descriptions are shown in the table", () => {
    render(<AdminServicesPage />);
    // svc-1 short_description
    expect(
      screen.getByText(
        "Sacred worship of Lord Ganesha, the remover of obstacles."
      )
    ).toBeInTheDocument();
  });
});
