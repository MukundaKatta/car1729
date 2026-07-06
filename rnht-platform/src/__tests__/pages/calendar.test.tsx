import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// The public Events Calendar was retired — the page now just redirects home.
const replaceMock = vi.fn();
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, back: vi.fn() }),
  usePathname: () => "/calendar",
  useSearchParams: () => new URLSearchParams(),
}));

import CalendarPage from "@/app/calendar/page";

describe("CalendarPage (retired → redirects home)", () => {
  beforeEach(() => replaceMock.mockClear());

  it("redirects to the homepage on mount", () => {
    render(<CalendarPage />);
    expect(replaceMock).toHaveBeenCalledWith("/");
  });

  it("shows a redirect notice with a link home", () => {
    render(<CalendarPage />);
    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
  });
});
