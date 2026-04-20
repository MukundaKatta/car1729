import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const servicesData = [
  {
    id: "svc-1",
    category_id: "cat-1",
    name: "Ganapathi Pooja",
    slug: "ganapathi-pooja",
    short_description: "Short description",
    full_description: "Full description",
    significance: "Auspicious",
    is_active: true,
    sort_order: 1,
  },
];

const categoriesData = [
  { id: "cat-1", name: "Pooja & Samskaras", slug: "pooja", description: "", icon: "🙏", sort_order: 1, created_at: "" },
];

function makeBuilder(table: string) {
  const data = table === "services" ? servicesData : categoriesData;
  return {
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        order: vi.fn(async () => ({ data, error: null })),
        then: undefined,
      })),
    })),
    insert: vi.fn(async () => ({ error: null })),
    update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
  };
}

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));
vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) => {
    const state = {
      authUser: { email: "approver@rnht.org" },
      user: { email: "approver@rnht.org" },
    };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

import AdminServicesPage from "@/app/admin/services/page";

describe("AdminServicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((table: string) => makeBuilder(table));
  });

  it("loads and renders services from supabase", async () => {
    render(<AdminServicesPage />);
    expect(await screen.findByText("Ganapathi Pooja")).toBeInTheDocument();
    expect(screen.getByText("Manage Services")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows the upload and add actions", async () => {
    render(<AdminServicesPage />);
    await screen.findByText("Ganapathi Pooja");
    expect(screen.getByText("Upload PDF").closest("a")).toHaveAttribute("href", "/admin/services/upload");
    expect(screen.getByText("Add Service")).toBeInTheDocument();
  });

  it("opens the new service form", async () => {
    render(<AdminServicesPage />);
    await screen.findByText("Ganapathi Pooja");
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("New Service")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ganapathi Homam")).toHaveValue("");
    expect(screen.getByDisplayValue("0")).toBeInTheDocument();
  });

  it("validates missing required fields in the form", async () => {
    render(<AdminServicesPage />);
    await screen.findByText("Ganapathi Pooja");
    fireEvent.click(screen.getByText("Add Service"));
    fireEvent.click(screen.getByText("Save"));
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
  });

  it("opens the edit form for an existing service", async () => {
    render(<AdminServicesPage />);
    await screen.findByText("Ganapathi Pooja");
    fireEvent.click(screen.getAllByRole("button")[2]);
    expect(screen.getByText("Edit Service")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ganapathi-pooja")).toBeInTheDocument();
  });
});
