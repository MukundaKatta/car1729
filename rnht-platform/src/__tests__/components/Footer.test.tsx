import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe("Footer", () => {
  it("renders the redesigned footer heading and supporting copy", () => {
    render(<Footer />);
    expect(screen.getByText("Stay Connected")).toBeInTheDocument();
    expect(screen.getByText("Follow RNHT")).toBeInTheDocument();
    expect(
      screen.getByText(/Temple updates, booking support, and important links/i)
    ).toBeInTheDocument();
  });

  it("renders the compact legal and contact links", () => {
    render(<Footer />);
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("renders social links for the temple and priest contact channels", () => {
    render(<Footer />);
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram - Temple")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Instagram - Pandit Aditya Sharma")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
  });
});
