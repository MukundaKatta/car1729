/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
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
  usePathname: () => "/admin/events",
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

// Mock the EventCard component to avoid its own dependencies
vi.mock("@/components/calendar/EventCard", () => ({
  EventCard: ({ event }: any) => (
    <div data-testid="event-card">{event.title}</div>
  ),
}));

import AdminEventsPage from "@/app/admin/events/page";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("AdminEventsPage", () => {
  it("renders without crashing", () => {
    render(<AdminEventsPage />);
    expect(screen.getByText("Manage Events")).toBeInTheDocument();
  });

  it("shows back to dashboard link pointing to /admin", () => {
    render(<AdminEventsPage />);
    const backLink = screen.getByText("Back to Dashboard");
    expect(backLink.closest("a")).toHaveAttribute("href", "/admin");
  });

  it("shows Add Event button", () => {
    render(<AdminEventsPage />);
    expect(screen.getByText("Add Event")).toBeInTheDocument();
  });

  it("shows events table with all headers", () => {
    render(<AdminEventsPage />);
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("RSVPs")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("displays events from sample data with titles and descriptions", () => {
    render(<AdminEventsPage />);
    expect(screen.getByText("Ugadi Celebrations 2026")).toBeInTheDocument();
    expect(screen.getByText("Sri Rama Navami")).toBeInTheDocument();
    expect(screen.getByText("Weekly Bhajan Sandhya")).toBeInTheDocument();
    expect(screen.getByText("Yoga & Meditation Session")).toBeInTheDocument();
    // Data rows + header row
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(8); // 1 header + 7 events
  });

  it("displays event type labels correctly", () => {
    render(<AdminEventsPage />);
    // Festival events
    const festivalLabels = screen.getAllByText("Festival");
    expect(festivalLabels.length).toBeGreaterThanOrEqual(1);
    // Regular Pooja
    const poojaLabels = screen.getAllByText("Regular Pooja");
    expect(poojaLabels.length).toBeGreaterThanOrEqual(1);
    // Community Event
    expect(screen.getByText("Community Event")).toBeInTheDocument();
    // Class
    expect(screen.getByText("Class")).toBeInTheDocument();
  });

  it("shows (recurring) label for recurring events", () => {
    render(<AdminEventsPage />);
    const recurringLabels = screen.getAllByText("(recurring)");
    // evt-3, evt-4, evt-5, evt-6 are recurring
    expect(recurringLabels.length).toBe(4);
  });

  it("displays event date and time in the table", () => {
    render(<AdminEventsPage />);
    // evt-1 has start_date 2026-03-29, start_time 09:00
    expect(screen.getByText(/2026-03-29/)).toBeInTheDocument();
    expect(screen.getByText(/at 09:00/)).toBeInTheDocument();
  });

  it("shows RSVP count for events with RSVP enabled and dash for disabled", () => {
    render(<AdminEventsPage />);
    // evt-1 has rsvp_count=45, rsvp_enabled=true
    expect(screen.getByText("45")).toBeInTheDocument();
    // evt-3 has rsvp_enabled=false, should show dash
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  // --- Modal: Add Event ---

  it("opens add event modal when clicking Add Event", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));
    expect(screen.getByText("Add New Event")).toBeInTheDocument();
    expect(screen.getByText("Event Title *")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Event Type")).toBeInTheDocument();
    expect(screen.getByText("Date *")).toBeInTheDocument();
  });

  it("shows start/end time and location fields in modal", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));
    expect(screen.getByText("Start Time")).toBeInTheDocument();
    expect(screen.getByText("End Time")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    // Default location value
    expect(
      screen.getByDisplayValue("RNHT Main Temple Hall")
    ).toBeInTheDocument();
  });

  it("shows RSVP checkbox checked by default in add modal", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));
    expect(screen.getByText("Enable RSVP")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("shows event type select with all four options", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));
    const select = screen.getByDisplayValue("Festival") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent("Festival");
    expect(options[1]).toHaveTextContent("Regular Pooja");
    expect(options[2]).toHaveTextContent("Community Event");
    expect(options[3]).toHaveTextContent("Class");
  });

  it("closes modal when clicking Cancel", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));
    expect(screen.getByText("Add New Event")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Add New Event")).not.toBeInTheDocument();
  });

  it("disables submit button when title and date are empty", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));
    const addBtns = screen.getAllByText("Add Event");
    const submitBtn = addBtns[addBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when title and date are provided", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));

    // Fill in title
    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(titleInput, { target: { value: "New Test Event" } });

    // Fill in date
    const dateInput = screen
      .getByText("Date *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(dateInput, { target: { value: "2026-05-01" } });

    const addBtns = screen.getAllByText("Add Event");
    const submitBtn = addBtns[addBtns.length - 1];
    expect(submitBtn).not.toBeDisabled();
  });

  it("fills in all form fields and saves a new event", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));

    // Fill title
    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(titleInput, { target: { value: "Brand New Festival" } });

    // Fill description
    const descTextarea = screen
      .getByText("Description")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, {
      target: { value: "A wonderful celebration" },
    });

    // Change event type
    const typeSelect = screen.getByDisplayValue(
      "Festival"
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "community" } });

    // Fill date
    const dateInput = screen
      .getByText("Date *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(dateInput, { target: { value: "2026-06-15" } });

    // Fill start time
    const startTimeInput = screen
      .getByText("Start Time")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(startTimeInput, { target: { value: "10:00" } });

    // Fill end time
    const endTimeInput = screen
      .getByText("End Time")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(endTimeInput, { target: { value: "14:00" } });

    // Change location
    const locationInput = screen.getByDisplayValue("RNHT Main Temple Hall");
    fireEvent.change(locationInput, {
      target: { value: "Community Center" },
    });

    // Uncheck RSVP
    const rsvpCheckbox = screen.getByRole("checkbox");
    fireEvent.click(rsvpCheckbox);
    expect(rsvpCheckbox).not.toBeChecked();

    // Click save
    const addBtns = screen.getAllByText("Add Event");
    const submitBtn = addBtns[addBtns.length - 1];
    fireEvent.click(submitBtn);

    // Modal should close
    expect(screen.queryByText("Add New Event")).not.toBeInTheDocument();

    // New event should appear in table
    expect(screen.getByText("Brand New Festival")).toBeInTheDocument();
    expect(
      screen.getByText("A wonderful celebration")
    ).toBeInTheDocument();
  });

  // --- Modal: Edit Event ---

  it("opens edit modal with pre-filled data when clicking edit button", () => {
    render(<AdminEventsPage />);

    // Find the first edit button (Edit2 icon buttons)
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[0]);

    // Should show "Edit Event" title
    expect(screen.getByText("Edit Event")).toBeInTheDocument();
    // Should show "Save Changes" instead of "Add Event" on submit
    expect(screen.getByText("Save Changes")).toBeInTheDocument();

    // First event is "Ugadi Celebrations 2026"
    expect(
      screen.getByDisplayValue("Ugadi Celebrations 2026")
    ).toBeInTheDocument();
  });

  it("saves changes to an edited event", () => {
    render(<AdminEventsPage />);

    // Click edit on first event
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[0]);

    // Change the title
    const titleInput = screen.getByDisplayValue("Ugadi Celebrations 2026");
    fireEvent.change(titleInput, {
      target: { value: "Ugadi Celebrations Updated" },
    });

    // Save
    fireEvent.click(screen.getByText("Save Changes"));

    // Modal should close
    expect(screen.queryByText("Edit Event")).not.toBeInTheDocument();

    // Updated title should appear in table
    expect(
      screen.getByText("Ugadi Celebrations Updated")
    ).toBeInTheDocument();
    // Original title should no longer be there
    expect(
      screen.queryByText("Ugadi Celebrations 2026")
    ).not.toBeInTheDocument();
  });

  it("preserves rsvp_count when editing an event", () => {
    render(<AdminEventsPage />);

    // evt-1 has rsvp_count 45
    expect(screen.getByText("45")).toBeInTheDocument();

    // Edit the first event
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[0]);
    fireEvent.click(screen.getByText("Save Changes"));

    // RSVP count should still show
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  // --- Delete Event ---

  it("deletes an event when confirm returns true", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminEventsPage />);

    expect(screen.getByText("Ugadi Celebrations 2026")).toBeInTheDocument();

    // Click delete on first event
    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-red-50");
    });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this event?"
    );
    // Event should be removed
    expect(
      screen.queryByText("Ugadi Celebrations 2026")
    ).not.toBeInTheDocument();
    // Other events should still be there
    expect(screen.getByText("Sri Rama Navami")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("does not delete an event when confirm returns false", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminEventsPage />);

    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-red-50");
    });
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    // Event should still be present
    expect(screen.getByText("Ugadi Celebrations 2026")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  // --- RSVP Toggle ---

  it("toggles RSVP checkbox in the form modal", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked(); // default is true

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // --- Event Type Selection ---

  it("changes event type selection in the form", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));

    const typeSelect = screen.getByDisplayValue(
      "Festival"
    ) as HTMLSelectElement;

    fireEvent.change(typeSelect, { target: { value: "regular_pooja" } });
    expect((typeSelect as HTMLSelectElement).value).toBe("regular_pooja");

    fireEvent.change(typeSelect, { target: { value: "community" } });
    expect((typeSelect as HTMLSelectElement).value).toBe("community");

    fireEvent.change(typeSelect, { target: { value: "class" } });
    expect((typeSelect as HTMLSelectElement).value).toBe("class");

    fireEvent.change(typeSelect, { target: { value: "festival" } });
    expect((typeSelect as HTMLSelectElement).value).toBe("festival");
  });

  // --- Add Event button resets editing state ---

  it("clicking Add Event after editing opens a blank form", () => {
    render(<AdminEventsPage />);

    // First, open edit modal
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[0]);
    expect(screen.getByText("Edit Event")).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByText("Cancel"));

    // Now click Add Event
    fireEvent.click(screen.getByText("Add Event"));
    expect(screen.getByText("Add New Event")).toBeInTheDocument();

    // Title input should be empty
    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    expect(titleInput.value).toBe("");
  });

  // --- Multiple operations ---

  it("can add a new event and then delete it", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminEventsPage />);

    // Add a new event
    fireEvent.click(screen.getByText("Add Event"));
    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(titleInput, { target: { value: "Temp Event" } });
    const dateInput = screen
      .getByText("Date *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(dateInput, { target: { value: "2026-12-01" } });
    const addBtns = screen.getAllByText("Add Event");
    fireEvent.click(addBtns[addBtns.length - 1]);

    expect(screen.getByText("Temp Event")).toBeInTheDocument();

    // Now delete the last event (the one we just added)
    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-red-50");
    });
    // Last delete button corresponds to the newly added event
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(screen.queryByText("Temp Event")).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("edit modal pre-fills description and location for an event", () => {
    render(<AdminEventsPage />);

    // Edit second event (Sri Rama Navami)
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[1]);

    expect(screen.getByDisplayValue("Sri Rama Navami")).toBeInTheDocument();
    // Check location is pre-filled
    expect(
      screen.getByDisplayValue("RNHT Main Temple Hall")
    ).toBeInTheDocument();
    // Check description textarea is pre-filled
    const descTextarea = screen
      .getByText("Description")
      .closest("div")!
      .querySelector("textarea")!;
    expect(descTextarea.value).toContain("Lord Rama");
  });

  it("edit modal pre-fills start/end times", () => {
    render(<AdminEventsPage />);

    // Edit first event (Ugadi): start_time 09:00, end_time 14:00
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[0]);

    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14:00")).toBeInTheDocument();
  });

  it("edit modal pre-fills event type and date", () => {
    render(<AdminEventsPage />);

    // Edit first event (Ugadi): event_type festival, start_date 2026-03-29
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    fireEvent.click(editButtons[0]);

    const typeSelect = screen.getByDisplayValue(
      "Festival"
    ) as HTMLSelectElement;
    expect(typeSelect.value).toBe("festival");
    expect(screen.getByDisplayValue("2026-03-29")).toBeInTheDocument();
  });

  it("edit modal pre-fills rsvp_enabled state", () => {
    render(<AdminEventsPage />);

    // Edit evt-3 (Weekly Bhajan Sandhya): rsvp_enabled = false
    const editButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-blue-50");
    });
    // evt-3 is the 3rd event (index 2)
    fireEvent.click(editButtons[2]);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("total row count decreases after deleting an event", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminEventsPage />);

    const rowsBefore = screen.getAllByRole("row").length;

    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg") && btn.className.includes("hover:bg-red-50");
    });
    fireEvent.click(deleteButtons[0]);

    const rowsAfter = screen.getAllByRole("row").length;
    expect(rowsAfter).toBe(rowsBefore - 1);

    confirmSpy.mockRestore();
  });
});
