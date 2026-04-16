import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: ({ fill: _fill, alt, ...props }: any) => <img {...props} alt={alt ?? ""} />,
}));
vi.mock("@/components/hero/HeroSlideshow", () => ({
  HeroSlideshow: () => <div data-testid="hero-slideshow" />,
}));
vi.mock("@/components/home/HomeTempleCalendar", () => ({
  HomeTempleCalendar: () => <div data-testid="home-temple-calendar">Temple Calendar</div>,
}));
vi.mock("@/components/home/NewsAndUpdates", () => ({
  NewsAndUpdates: () => <div data-testid="news-and-updates">News &amp; Updates</div>,
}));
vi.mock("@/components/services/ServiceCard", () => ({
  ServiceCard: ({ service }: any) => <div data-testid="service-card">{service.name}</div>,
}));

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the hero, calendar, and news sections", () => {
    render(<HomePage />);
    expect(screen.getByTestId("hero-slideshow")).toBeInTheDocument();
    expect(screen.getByTestId("home-temple-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("news-and-updates")).toBeInTheDocument();
  });

  it("shows the quick info bar with the current location and phone", () => {
    render(<HomePage />);
    expect(screen.getByText("Georgetown, TX 78628")).toBeInTheDocument();
    expect(screen.getByText("(512) 545-0473")).toBeInTheDocument();
    expect(screen.getByText("Support the Temple")).toBeInTheDocument();
  });

  it("shows the trust stats section with current values", () => {
    render(<HomePage />);
    expect(screen.getByText("Est. 2022")).toBeInTheDocument();
    expect(screen.getByText("50+")).toBeInTheDocument();
    expect(screen.getAllByText("Experienced Priests").length).toBeGreaterThan(0);
    expect(screen.getByText("12+")).toBeInTheDocument();
  });

  it("renders featured service cards", () => {
    render(<HomePage />);
    expect(screen.getAllByTestId("service-card")).toHaveLength(4);
  });

  it("shows the major homepage sections", () => {
    render(<HomePage />);
    expect(screen.getByText("Our Sacred Services")).toBeInTheDocument();
    expect(screen.getByText("Why Choose RNHT")).toBeInTheDocument();
    expect(screen.getByText("What Devotees Say")).toBeInTheDocument();
    expect(screen.getByText("Explore RNHT")).toBeInTheDocument();
    expect(screen.getByText("News & Updates")).toBeInTheDocument();
  });
});
