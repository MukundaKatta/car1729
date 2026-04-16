import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/calendar",
  useSearchParams: () => new URLSearchParams(),
}));

import CalendarPage from "@/app/calendar/page";

describe("CalendarPage", () => {
  it("renders the heading and subtitle", () => {
    render(<CalendarPage />);
    expect(screen.getByRole("heading", { name: /temple calendar/i })).toBeInTheDocument();
    expect(screen.getByText(/stay connected with festivals/i)).toBeInTheDocument();
  });

  it("shows all sample events in list view by default", () => {
    render(<CalendarPage />);
    expect(screen.getByText("Ugadi Celebrations 2026")).toBeInTheDocument();
    expect(screen.getByText("Sri Rama Navami")).toBeInTheDocument();
    expect(screen.getByText("Weekly Bhajan Sandhya")).toBeInTheDocument();
    expect(screen.getByText("Yoga & Meditation Session")).toBeInTheDocument();
    expect(screen.getByText("Community Annadanam")).toBeInTheDocument();
  });

  it("filters festival events", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByText("Festivals"));
    expect(screen.getByText("Ugadi Celebrations 2026")).toBeInTheDocument();
    expect(screen.getByText("Sri Rama Navami")).toBeInTheDocument();
    expect(screen.getByText("Hanuman Jayanti")).toBeInTheDocument();
    expect(screen.queryByText("Weekly Bhajan Sandhya")).not.toBeInTheDocument();
  });

  it("filters class events", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByText("Classes"));
    expect(screen.getByText("Yoga & Meditation Session")).toBeInTheDocument();
    expect(screen.queryByText("Ugadi Celebrations 2026")).not.toBeInTheDocument();
  });

  it("filters community events", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getAllByText("Community")[0]);
    expect(screen.getByText("Community Annadanam")).toBeInTheDocument();
    expect(screen.queryByText("Sri Rama Navami")).not.toBeInTheDocument();
  });

  it("switches to calendar view and shows weekday headers", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByText("Calendar"));
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
  });

  it("can switch back to list view", () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByText("Calendar"));
    fireEvent.click(screen.getByText("List"));
    expect(screen.getByText("Ugadi Celebrations 2026")).toBeInTheDocument();
  });
});
