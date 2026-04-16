import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt ?? ""} />,
}));
vi.mock("@/components/hero/HeroSlideshow", () => ({
  HeroSlideshow: () => <div data-testid="hero-slideshow" />,
}));
vi.mock("@/components/panchangam/PanchangamWidget", () => ({
  PanchangamWidget: () => <div data-testid="panchangam-widget" />,
}));
vi.mock("@/components/services/ServiceCard", () => ({
  ServiceCard: ({ service }: any) => <div data-testid="service-card">{service.name}</div>,
}));
vi.mock("@/components/calendar/EventCard", () => ({
  EventCard: ({ event }: any) => <div data-testid="event-card">{event.title}</div>,
}));

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the hero and panchangam sections", () => {
    render(<HomePage />);
    expect(screen.getByTestId("hero-slideshow")).toBeInTheDocument();
    expect(screen.getByTestId("panchangam-widget")).toBeInTheDocument();
  });

  it("shows the quick info bar with the current location and phone", () => {
    render(<HomePage />);
    expect(screen.getByText("Georgetown, TX 78628")).toBeInTheDocument();
    expect(screen.getByText("(512) 545-0473")).toBeInTheDocument();
    expect(screen.getByText(/9 AM – 12 PM/)).toBeInTheDocument();
  });

  it("shows the trust stats section with current values", () => {
    render(<HomePage />);
    expect(screen.getByText("Est. 2022")).toBeInTheDocument();
    expect(screen.getByText("50+")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("12+")).toBeInTheDocument();
  });

  it("renders featured service cards and event cards", () => {
    render(<HomePage />);
    expect(screen.getAllByTestId("service-card")).toHaveLength(4);
    expect(screen.getAllByTestId("event-card").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the major homepage sections", () => {
    render(<HomePage />);
    expect(screen.getByText("Our Sacred Services")).toBeInTheDocument();
    expect(screen.getByText("Why Choose RNHT")).toBeInTheDocument();
    expect(screen.getByText("What Devotees Say")).toBeInTheDocument();
    expect(screen.getByText("Explore RNHT")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Events")).toBeInTheDocument();
  });
});
