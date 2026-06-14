import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "@/components/calendar/EventCard";
import type { Event } from "@/types/database";

const mockEvent: Event = {
  id: "evt-1",
  title: "Ganesh Chaturthi Festival",
  description: "Annual celebration of Lord Ganesha",
  event_type: "festival",
  start_date: "2026-09-05",
  end_date: null,
  start_time: "10:00",
  end_time: "13:00",
  location: "Main Temple Hall",
  image_url: null,
  is_recurring: false,
  recurrence_rule: null,
  rsvp_enabled: true,
  rsvp_count: 42,
  created_at: new Date().toISOString(),
};

describe("EventCard", () => {
  it("renders the event title", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Ganesh Chaturthi Festival")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<EventCard event={mockEvent} />);
    expect(
      screen.getByText("Annual celebration of Lord Ganesha")
    ).toBeInTheDocument();
  });

  it("renders the event type label", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Festival")).toBeInTheDocument();
  });

  it("renders time range in 12-hour format", () => {
    render(<EventCard event={mockEvent} />);
    // Regex (not exact string) because Intl may use a narrow no-break space before AM/PM.
    expect(screen.getByText(/10:00.*AM.*-.*1:00.*PM/i)).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Main Temple Hall")).toBeInTheDocument();
  });

  it("renders RSVP count when enabled", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("42 attending")).toBeInTheDocument();
  });

  it("renders RSVP button when enabled", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("RSVP")).toBeInTheDocument();
  });

  it("renders Add to Cal link for non-recurring events", () => {
    render(<EventCard event={mockEvent} />);
    expect(
      screen.getByLabelText("Add Ganesh Chaturthi Festival to Google Calendar")
    ).toBeInTheDocument();
  });

  it("hides RSVP when disabled", () => {
    render(<EventCard event={{ ...mockEvent, rsvp_enabled: false }} />);
    expect(screen.queryByText("RSVP")).not.toBeInTheDocument();
  });

  it("hides Add to Cal for recurring events", () => {
    render(<EventCard event={{ ...mockEvent, is_recurring: true }} />);
    expect(screen.queryByText("Add to Cal")).not.toBeInTheDocument();
  });

  it("uses article element", () => {
    const { container } = render(<EventCard event={mockEvent} />);
    expect(container.querySelector("article")).toBeInTheDocument();
  });
});
