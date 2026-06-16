import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React from "react";

import CommunityPage from "@/app/community/page";

describe("CommunityPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders the community hub and volunteer tab", () => {
    render(<CommunityPage />);
    expect(screen.getByRole("heading", { name: /community hub/i })).toBeInTheDocument();
    expect(screen.getByText("Volunteer Opportunities")).toBeInTheDocument();
  });

  it("opens the volunteer signup modal", () => {
    render(<CommunityPage />);
    fireEvent.click(screen.getAllByText("Enquire")[0]);
    expect(screen.getByText("Volunteer Enquiry")).toBeInTheDocument();
  });

  it("submits the signup form when required fields are filled", () => {
    render(<CommunityPage />);
    fireEvent.click(screen.getAllByText("Enquire")[0]);
    fireEvent.change(screen.getByPlaceholderText("Full Name *"), { target: { value: "Rajesh Sharma" } });
    fireEvent.change(screen.getByPlaceholderText("Email *"), { target: { value: "rajesh@example.com" } });
    // The modal's submit button is the "Enquire" control inside the dialog.
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Enquire" }));
    expect(window.alert).toHaveBeenCalled();
  });

  it("switches to the Annadanam and Announcements tabs", () => {
    render(<CommunityPage />);
    fireEvent.click(screen.getByText("Annadanam"));
    expect(screen.getByText(/community meal service/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Announcements"));
    expect(screen.getByText("Ugadi 2026 Celebration Details")).toBeInTheDocument();
  });
});
