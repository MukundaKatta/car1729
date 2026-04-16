import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppButton } from "@/components/effects/WhatsAppButton";

describe("WhatsAppButton", () => {
  it("renders a link element", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("links to the correct WhatsApp URL", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://wa.me/message/P3YRA2XY3GI7F1");
  });

  it("opens in a new tab", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("has noopener noreferrer for security", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has correct aria-label for accessibility", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "Chat on WhatsApp");
  });

  it("has correct title attribute", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("title", "WhatsApp Us");
  });

  it("renders the WhatsApp SVG icon", () => {
    const { container } = render(<WhatsAppButton />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("fill", "currentColor");
  });

  it("has fixed positioning", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("fixed", "z-50");
  });

  it("has WhatsApp green gradient background", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    // Check inline style attribute for gradient - jsdom may not parse gradient into style property
    const bg = link.getAttribute("style") || link.style.cssText;
    expect(bg).toContain("linear-gradient");
    // Color may appear as hex #25D366 or rgb(37, 211, 102) depending on jsdom
    expect(bg).toMatch(/#25D366|rgb\(37,\s*211,\s*102\)/);
  });

  it("has rounded-full shape", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("rounded-full");
  });

  it("has shadow for visibility", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("shadow-lg");
  });

  it("icon has correct size classes", () => {
    const { container } = render(<WhatsAppButton />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-5", "w-5", "text-white");
  });
});
