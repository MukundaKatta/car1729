import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import EducationPage from "@/app/education/page";

describe("EducationPage", () => {
  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("renders the education hub and core programs", () => {
    render(<EducationPage />);
    expect(screen.getByRole("heading", { name: /education & classes/i })).toBeInTheDocument();
    expect(screen.getByText("Vedic Chanting (Sri Rudram)")).toBeInTheDocument();
  });

  it("filters by category", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getAllByText(/Vedic School/)[0]);
    expect(screen.getByText("Sanskrit for Beginners")).toBeInTheDocument();
    expect(screen.queryByText("Bharatanatyam Dance")).not.toBeInTheDocument();
  });

  it("opens and submits the registration modal", () => {
    render(<EducationPage />);
    fireEvent.click(screen.getAllByText("Register Now")[0]);
    expect(screen.getByText(/Register: Vedic Chanting/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Student Full Name *"), { target: { value: "Student Name" } });
    fireEvent.change(screen.getByPlaceholderText("Email *"), { target: { value: "student@example.com" } });
    fireEvent.click(screen.getByText(/Register & Pay/));
    expect(window.alert).toHaveBeenCalled();
  });
});
