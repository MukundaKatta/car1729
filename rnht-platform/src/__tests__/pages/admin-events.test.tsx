/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const eventsData = [
  {
    id: "evt-1",
    title: "Ugadi Celebrations 2026",
    description: "Telugu New Year festivities",
    event_type: "festival",
    start_date: "2026-03-29",
    end_date: "2026-03-29",
    start_time: "09:00",
    end_time: "14:00",
    location: "RNHT Main Temple Hall",
    image_url: null,
    is_recurring: false,
    recurrence_rule: null,
    rsvp_enabled: true,
    rsvp_count: 45,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "evt-2",
    title: "Sri Rama Navami",
    description: "Celebrating the birth of Lord Rama",
    event_type: "festival",
    start_date: "2026-04-06",
    end_date: "2026-04-06",
    start_time: "10:00",
    end_time: "13:00",
    location: "RNHT Main Temple Hall",
    image_url: null,
    is_recurring: false,
    recurrence_rule: null,
    rsvp_enabled: true,
    rsvp_count: 30,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "evt-3",
    title: "Weekly Bhajan Sandhya",
    description: "Devotional singing every Friday",
    event_type: "regular_pooja",
    start_date: "2026-01-09",
    end_date: null,
    start_time: "18:00",
    end_time: "19:30",
    location: "RNHT Main Temple Hall",
    image_url: null,
    is_recurring: true,
    recurrence_rule: "FREQ=WEEKLY",
    rsvp_enabled: false,
    rsvp_count: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const { mockFrom, insertMock, updateMock, deleteMock, updateEqMock, deleteEqMock } =
  vi.hoisted(() => ({
    mockFrom: vi.fn(),
    insertMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
    updateEqMock: vi.fn(),
    deleteEqMock: vi.fn(),
  }));

function makeBuilder() {
  return {
    select: vi.fn(() => ({
      order: vi.fn(async () => ({ data: eventsData, error: null })),
    })),
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
  };
}

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
    from: mockFrom,
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
vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => {
    const state = {
      authUser: { email: "approver@rnht.org" },
      user: { email: "approver@rnht.org" },
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

import AdminEventsPage from "@/app/admin/events/page";

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockImplementation(() => makeBuilder());
  insertMock.mockResolvedValue({ error: null });
  updateEqMock.mockResolvedValue({ error: null });
  deleteEqMock.mockResolvedValue({ error: null });
  updateMock.mockImplementation(() => ({ eq: updateEqMock }));
  deleteMock.mockImplementation(() => ({ eq: deleteEqMock }));
});

describe("AdminEventsPage", () => {
  it("renders without crashing", async () => {
    render(<AdminEventsPage />);
    expect(screen.getByText("Manage Events")).toBeInTheDocument();
    await screen.findByText("Ugadi Celebrations 2026");
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

  it("does not show the local-only warning banner", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");
    expect(
      screen.queryByText(/local only/i)
    ).not.toBeInTheDocument();
  });

  it("shows events table with all headers", () => {
    render(<AdminEventsPage />);
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("RSVPs")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("loads and renders events from supabase", async () => {
    render(<AdminEventsPage />);
    expect(await screen.findByText("Ugadi Celebrations 2026")).toBeInTheDocument();
    expect(screen.getByText("Sri Rama Navami")).toBeInTheDocument();
    expect(screen.getByText("Weekly Bhajan Sandhya")).toBeInTheDocument();
    expect(mockFrom).toHaveBeenCalledWith("events");
  });

  it("displays event type labels correctly", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");
    const festivalLabels = screen.getAllByText("Festival");
    expect(festivalLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Regular Pooja")).toBeInTheDocument();
  });

  it("shows (recurring) label for recurring events", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Weekly Bhajan Sandhya");
    const recurringLabels = screen.getAllByText("(recurring)");
    expect(recurringLabels.length).toBe(1); // evt-3 is recurring
  });

  it("displays event date and time in the table", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");
    expect(screen.getByText(/2026-03-29/)).toBeInTheDocument();
    expect(screen.getByText(/at 09:00/)).toBeInTheDocument();
  });

  it("shows RSVP count for events with RSVP enabled and dash for disabled", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");
    // evt-1 has rsvp_count=45, rsvp_enabled=true
    expect(screen.getByText("45")).toBeInTheDocument();
    // evt-3 has rsvp_enabled=false, should show dash
    const dashes = screen.getAllByText("—");
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

    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(titleInput, { target: { value: "New Test Event" } });

    const dateInput = screen
      .getByText("Date *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(dateInput, { target: { value: "2026-05-01" } });

    const addBtns = screen.getAllByText("Add Event");
    const submitBtn = addBtns[addBtns.length - 1];
    expect(submitBtn).not.toBeDisabled();
  });

  it("inserts a new event via supabase when saving the add form", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(screen.getByText("Add Event"));

    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(titleInput, { target: { value: "Brand New Festival" } });

    const descTextarea = screen
      .getByText("Description")
      .closest("div")!
      .querySelector("textarea")!;
    fireEvent.change(descTextarea, {
      target: { value: "A wonderful celebration" },
    });

    const typeSelect = screen.getByDisplayValue("Festival") as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "community" } });

    const dateInput = screen
      .getByText("Date *")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(dateInput, { target: { value: "2026-06-15" } });

    const startTimeInput = screen
      .getByText("Start Time")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(startTimeInput, { target: { value: "10:00" } });

    const endTimeInput = screen
      .getByText("End Time")
      .closest("div")!
      .querySelector("input")!;
    fireEvent.change(endTimeInput, { target: { value: "14:00" } });

    const locationInput = screen.getByDisplayValue("RNHT Main Temple Hall");
    fireEvent.change(locationInput, { target: { value: "Community Center" } });

    const rsvpCheckbox = screen.getByRole("checkbox");
    fireEvent.click(rsvpCheckbox);
    expect(rsvpCheckbox).not.toBeChecked();

    const addBtns = screen.getAllByText("Add Event");
    const submitBtn = addBtns[addBtns.length - 1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledTimes(1);
    });
    const payload = insertMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: "Brand New Festival",
      description: "A wonderful celebration",
      event_type: "community",
      start_date: "2026-06-15",
      start_time: "10:00",
      end_time: "14:00",
      location: "Community Center",
      rsvp_enabled: false,
    });
    // Should not send columns that don't exist on the table
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("rsvp_count");
    expect(payload).not.toHaveProperty("created_at");

    // Modal closes after a successful save
    await waitFor(() => {
      expect(screen.queryByText("Add New Event")).not.toBeInTheDocument();
    });
  });

  // --- Modal: Edit Event ---

  it("opens edit modal with pre-filled data when clicking edit button", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /edit ugadi celebrations 2026/i })
    );

    expect(screen.getByText("Edit Event")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Ugadi Celebrations 2026")
    ).toBeInTheDocument();
  });

  it("updates an event via supabase when saving the edit form", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /edit ugadi celebrations 2026/i })
    );

    const titleInput = screen.getByDisplayValue("Ugadi Celebrations 2026");
    fireEvent.change(titleInput, {
      target: { value: "Ugadi Celebrations Updated" },
    });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledTimes(1);
    });
    expect(updateMock.mock.calls[0][0]).toMatchObject({
      title: "Ugadi Celebrations Updated",
    });
    expect(updateEqMock).toHaveBeenCalledWith("id", "evt-1");

    await waitFor(() => {
      expect(screen.queryByText("Edit Event")).not.toBeInTheDocument();
    });
  });

  it("edit modal pre-fills description and location for an event", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Sri Rama Navami");

    fireEvent.click(
      screen.getByRole("button", { name: /edit sri rama navami/i })
    );

    expect(screen.getByDisplayValue("Sri Rama Navami")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("RNHT Main Temple Hall")
    ).toBeInTheDocument();
    const descTextarea = screen
      .getByText("Description")
      .closest("div")!
      .querySelector("textarea")!;
    expect(descTextarea.value).toContain("Lord Rama");
  });

  it("edit modal pre-fills start/end times", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /edit ugadi celebrations 2026/i })
    );

    expect(screen.getByDisplayValue("09:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("14:00")).toBeInTheDocument();
  });

  it("edit modal pre-fills event type and date", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /edit ugadi celebrations 2026/i })
    );

    const typeSelect = screen.getByDisplayValue("Festival") as HTMLSelectElement;
    expect(typeSelect.value).toBe("festival");
    expect(screen.getByDisplayValue("2026-03-29")).toBeInTheDocument();
  });

  it("edit modal pre-fills rsvp_enabled state", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Weekly Bhajan Sandhya");

    fireEvent.click(
      screen.getByRole("button", { name: /edit weekly bhajan sandhya/i })
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  // --- Delete Event ---

  it("deletes an event via supabase when confirm returns true", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /delete ugadi celebrations 2026/i })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this event?"
    );
    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });
    expect(deleteEqMock).toHaveBeenCalledWith("id", "evt-1");

    confirmSpy.mockRestore();
  });

  it("does not delete an event when confirm returns false", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /delete ugadi celebrations 2026/i })
    );

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  // --- RSVP Toggle ---

  it("toggles RSVP checkbox in the form modal", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // --- Event Type Selection ---

  it("changes event type selection in the form", () => {
    render(<AdminEventsPage />);
    fireEvent.click(screen.getByText("Add Event"));

    const typeSelect = screen.getByDisplayValue("Festival") as HTMLSelectElement;

    fireEvent.change(typeSelect, { target: { value: "regular_pooja" } });
    expect(typeSelect.value).toBe("regular_pooja");

    fireEvent.change(typeSelect, { target: { value: "community" } });
    expect(typeSelect.value).toBe("community");

    fireEvent.change(typeSelect, { target: { value: "class" } });
    expect(typeSelect.value).toBe("class");

    fireEvent.change(typeSelect, { target: { value: "festival" } });
    expect(typeSelect.value).toBe("festival");
  });

  // --- Add Event button resets editing state ---

  it("clicking Add Event after editing opens a blank form", async () => {
    render(<AdminEventsPage />);
    await screen.findByText("Ugadi Celebrations 2026");

    fireEvent.click(
      screen.getByRole("button", { name: /edit ugadi celebrations 2026/i })
    );
    expect(screen.getByText("Edit Event")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));

    fireEvent.click(screen.getByText("Add Event"));
    expect(screen.getByText("Add New Event")).toBeInTheDocument();

    const titleInput = screen
      .getByText("Event Title *")
      .closest("div")!
      .querySelector("input")!;
    expect(titleInput.value).toBe("");
  });
});
