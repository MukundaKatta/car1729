import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("Footer", () => {
  it("renders the temple name and nonprofit badge", () => {
    render(<Footer />);
    expect(screen.getByText("Rudra Narayana Hindu Temple")).toBeInTheDocument();
    expect(screen.getByText("501(c)(3) Registered Nonprofit")).toBeInTheDocument();
  });

  it("renders both priest contact numbers consistently", () => {
    render(<Footer />);
    expect(screen.getByText(/512.*545.*0473/)).toBeInTheDocument();
    expect(screen.getByText(/512.*998.*0122/)).toBeInTheDocument();
  });

  it("renders the main navigation links", () => {
    render(<Footer />);
    expect(screen.getByText("Book a Pooja")).toBeInTheDocument();
    expect(screen.getByText("Events Calendar")).toBeInTheDocument();
    expect(screen.getByText("Donate")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
  });
});
