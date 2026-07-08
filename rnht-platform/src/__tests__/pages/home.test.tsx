/* eslint-disable @next/next/no-img-element */
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
vi.mock("@/components/home/HomePanchangamScroll", () => ({
  HomePanchangamScroll: () => (
    <div data-testid="home-panchangam-scroll">Panchangam and Temple Calendar</div>
  ),
}));
vi.mock("@/components/home/ReadyToBookPriests", () => ({
  ReadyToBookPriests: () => <div data-testid="ready-to-book-priests">Priest cards</div>,
}));

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the hero and panchangam showcase sections", () => {
    render(<HomePage />);
    expect(screen.getByTestId("hero-slideshow")).toBeInTheDocument();
    expect(screen.getByTestId("home-panchangam-scroll")).toBeInTheDocument();
  });

  it("shows the four home action tiles", () => {
    render(<HomePage />);
    // Action-tile band (replaced the old stat band + the duplicate CTA row).
    expect(screen.getByText("Book a Pooja")).toBeInTheDocument();
    expect(screen.getByText("Join Temple WhatsApp Group")).toBeInTheDocument();
    expect(screen.getByText("Today's Panchangam")).toBeInTheDocument();
    expect(screen.getByText("Offer a Seva")).toBeInTheDocument();
  });

  it("renders the priest booking call-to-action area", () => {
    render(<HomePage />);
    expect(screen.getByText("Ready to Book a Pooja?")).toBeInTheDocument();
    expect(screen.getByTestId("ready-to-book-priests")).toBeInTheDocument();
  });

  it("shows the major homepage sections", () => {
    render(<HomePage />);
    expect(screen.getByText("Why Choose RNHT")).toBeInTheDocument();
    expect(screen.getByText("Nitya Pooja Seva")).toBeInTheDocument();
    expect(screen.getByText("What Devotees Say")).toBeInTheDocument();
    expect(screen.getByText("Ready to Book a Pooja?")).toBeInTheDocument();
  });
});
