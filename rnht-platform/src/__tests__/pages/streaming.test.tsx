import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import StreamingPage from "@/app/streaming/page";

// Reflects the current streaming page (YouTube + WhatsApp CTAs, daily darshan
// schedule, festival streams). The older embedded-player/"Watch Live" layout
// these tests used to assert has been replaced.
describe("StreamingPage", () => {
  it("renders the heading and intro", () => {
    render(<StreamingPage />);
    expect(
      screen.getByRole("heading", { name: /live darshan & streaming/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/watch live aarti/i)).toBeInTheDocument();
  });

  it("links to the temple YouTube channel", () => {
    render(<StreamingPage />);
    const links = screen.getAllByRole("link", { name: /youtube/i });
    expect(
      links.some(
        (l) =>
          l.getAttribute("href") ===
          "https://www.youtube.com/@rudranarayanahindutemple"
      )
    ).toBe(true);
  });

  it("offers a WhatsApp updates link", () => {
    render(<StreamingPage />);
    const link = screen.getByRole("link", {
      name: /join the whatsapp updates/i,
    });
    expect(link).toHaveAttribute("href", "https://wa.me/15125450473");
  });

  it("shows the regular live darshan schedule", () => {
    render(<StreamingPage />);
    expect(
      screen.getByRole("heading", { name: /regular live darshan schedule/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Morning Aarti & Suprabhatam/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Evening Aarti & Deeparadhana/i)
    ).toBeInTheDocument();
  });

  it("shows the festival & special streams section", () => {
    render(<StreamingPage />);
    expect(
      screen.getByRole("heading", { name: /festival & special streams/i })
    ).toBeInTheDocument();
  });
});
