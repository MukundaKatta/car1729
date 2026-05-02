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

  it("shows the quick info bar with the support phone", () => {
    render(<HomePage />);
    expect(screen.getByText("(512) 545-0473")).toBeInTheDocument();
  });

  it("shows the trust stats section with current values", () => {
    render(<HomePage />);
    expect(screen.getByText("Est. 2022")).toBeInTheDocument();
    expect(screen.getByText("50+")).toBeInTheDocument();
    expect(screen.getAllByText("Experienced Priests").length).toBeGreaterThan(0);
    expect(screen.getByText("12+")).toBeInTheDocument();
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
