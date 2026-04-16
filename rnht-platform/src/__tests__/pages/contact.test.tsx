import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

import ContactPage from "@/app/contact/page";

describe("ContactPage", () => {
  it("renders the key priest contact cards", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { name: /contact us/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pt\. aditya sharma/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pt\. raghurama sharma/i })).toBeInTheDocument();
  });

  it("shows the WhatsApp and phone actions", () => {
    render(<ContactPage />);
    const whatsapp = screen.getByRole("link", { name: /\(512\) 545-0473/i });
    const phone = screen.getByRole("link", { name: /\(512\) 998-0122/i });

    expect(whatsapp).toHaveAttribute("href", "https://wa.me/message/55G67NQ6CQENA1");
    expect(phone).toHaveAttribute("href", "tel:+15129980122");
  });

  it("links the temple WhatsApp group card to WhatsApp", () => {
    render(<ContactPage />);
    const groupLink = screen.getByRole("link", { name: /join temple whatsapp group/i });
    expect(groupLink).toHaveAttribute("href", "https://wa.me/message/55G67NQ6CQENA1");
    expect(groupLink).toHaveAttribute("target", "_blank");
  });

  it("shows the service areas and zelle section", () => {
    render(<ContactPage />);
    expect(screen.getByText(/service areas in texas/i)).toBeInTheDocument();
    expect(screen.getByText(/kyle, manor, austin/i)).toBeInTheDocument();
    expect(screen.getByText(/donate via zelle/i)).toBeInTheDocument();
  });
});
