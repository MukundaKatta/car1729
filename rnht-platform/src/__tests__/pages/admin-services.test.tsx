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
    image_url: null,
    is_active: true,
    sort_order: 1,
  },
];

const categoriesData = [
  { id: "cat-1", name: "Pooja & Samskaras", slug: "pooja", description: "", icon: "🙏", sort_order: 1, created_at: "" },
];

function makeBuilder(table: string) {
  const data = table === "services" ? servicesData : categoriesData;
  // A thenable that also exposes `.order()` so callers can either await the
  // select directly (e.g. `.select("slug")`) or chain `.order(...)`.
  function selectResult() {
    const result: any = {
      order: vi.fn(() => ({
        order: vi.fn(async () => ({ data, error: null })),
        then: (resolve: any) => resolve({ data, error: null }),
      })),
      then: (resolve: any) => resolve({ data, error: null }),
    };
    return result;
  }
  return {
    select: vi.fn(() => selectResult()),
    insert: vi.fn(async () => ({ error: null })),
    upsert: vi.fn(async () => ({ error: null })),
    update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
      in: vi.fn(async () => ({ error: null })),
    })),
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
    storage: {
      from: () => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: () => ({ data: { publicUrl: "https://example.com/service.jpg" } }),
      }),
    },
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
    expect(screen.getByText("Sync Catalog")).toBeInTheDocument();
    expect(screen.getByText("Add Service")).toBeInTheDocument();
  });

  it("opens the new service form", async () => {
    render(<AdminServicesPage />);
    await screen.findByText("Ganapathi Pooja");
    fireEvent.click(screen.getByText("Add Service"));
    expect(screen.getByText("New Service")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ganapathi Homam")).toHaveValue("");
    expect(screen.getByDisplayValue("0")).toBeInTheDocument();
    expect(screen.getByText("Upload image")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /edit ganapathi pooja/i }));
    expect(screen.getByText("Edit Service")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ganapathi-pooja")).toBeInTheDocument();
  });

  it("rolls back upserted categories when the services upsert fails during sync", async () => {
    const categoryDeleteIn = vi.fn(async () => ({ error: null }));
    const categoriesBuilder: any = {
      select: vi.fn(() => ({
        // pre-existing snapshot: no categories existed before the sync, so every
        // synced slug counts as newly created and is eligible for rollback.
        then: (resolve: any) => resolve({ data: [], error: null }),
        order: vi.fn(() => ({
          then: (resolve: any) => resolve({ data: categoriesData, error: null }),
        })),
      })),
      upsert: vi.fn(async () => ({ error: null })),
      delete: vi.fn(() => ({ in: categoryDeleteIn })),
    };
    const servicesBuilder: any = {
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(async () => ({ data: servicesData, error: null })),
        })),
        then: (resolve: any) => resolve({ data: [], error: null }),
      })),
      upsert: vi.fn(async () => ({ error: { message: "services upsert failed" } })),
    };

    mockFrom.mockImplementation((table: string) =>
      table === "services" ? servicesBuilder : categoriesBuilder
    );

    render(<AdminServicesPage />);
    await screen.findByText("Manage Services");
    fireEvent.click(screen.getByText("Sync Catalog"));

    expect(await screen.findByText("services upsert failed")).toBeInTheDocument();
    await waitFor(() => {
      expect(categoriesBuilder.delete).toHaveBeenCalled();
      expect(categoryDeleteIn).toHaveBeenCalled();
    });
    // Flag is cleared after rollback completes (button returns to idle label).
    expect(screen.getByText("Sync Catalog")).toBeInTheDocument();
  });
});
