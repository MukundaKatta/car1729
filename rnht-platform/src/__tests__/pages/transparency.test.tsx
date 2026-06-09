import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TransparencyPage from "@/app/transparency/page";

// The transparency page is a simple static server component. These tests
// reflect the current page (the older placeholder "financial dashboard" —
// Key Metrics, revenue figures, donor wall — was removed in #95).
describe("TransparencyPage", () => {
  it("renders the page heading and intro", () => {
    render(<TransparencyPage />);
    expect(
      screen.getByRole("heading", { name: /financial transparency/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/committed to financial transparency/i)
    ).toBeInTheDocument();
  });

  it("shows the 501(c)(3) nonprofit section", () => {
    render(<TransparencyPage />);
    expect(
      screen.getByRole("heading", { name: /501\(c\)\(3\) tax-exempt nonprofit/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all donations are tax-deductible/i)
    ).toBeInTheDocument();
  });

  it("shows the annual financial statements section with a WhatsApp request link", () => {
    render(<TransparencyPage />);
    expect(
      screen.getByRole("heading", { name: /annual financial statements/i })
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /request financial report/i });
    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/message/P3YRA2XY3GI7F1"
    );
  });

  it("shows the donor recognition section", () => {
    render(<TransparencyPage />);
    expect(
      screen.getByRole("heading", { name: /donor recognition/i })
    ).toBeInTheDocument();
  });
});
