import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/services",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => {
        if (table === "services") {
          return {
            eq: () => ({
              order: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          order: () => Promise.resolve({ data: [], error: null }),
        };
      },
    }),
  },
}));

vi.mock("@/store/language", () => ({
  useLanguageStore: (sel: any) => {
    const s = { locale: "en", setLocale: vi.fn() };
    return typeof sel === "function" ? sel(s) : s;
  },
}));

// The ServiceCard, ServiceAreas and ServicePdfDownloads sub-components are
// tested separately. Stub them to keep this test focused on the /services
// page itself.
vi.mock("@/components/services/ServiceCard", () => ({
  ServiceCard: ({ service }: any) => (
    <div data-testid="service-card">{service.name}</div>
  ),
}));
vi.mock("@/components/home/ServiceAreas", () => ({
  ServiceAreas: () => <section data-testid="service-areas">Serving All of Texas</section>,
}));
vi.mock("@/components/services/ServicePdfDownloads", () => ({
  ServicePdfDownloads: () => <div data-testid="pdf-downloads" />,
}));

import ServicesPage from "@/app/services/page";
import { sampleServices } from "@/lib/sample-data";

describe("ServicesPage", () => {
  it("renders the page heading without the retired intro lines", () => {
    render(<ServicesPage />);
    expect(
      screen.getByRole("heading", { name: /Pooja & Spiritual Services/i })
    ).toBeInTheDocument();
    // Client 07-08: both descriptive sub-heading lines were removed.
    expect(
      screen.queryByText(/Current catalog offerings include shanti pujas/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Service areas:/i)).not.toBeInTheDocument();
  });

  it("does NOT render the removed At Temple / Outside Temple or price filters", () => {
    render(<ServicesPage />);
    expect(screen.queryByRole("button", { name: "At Temple" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Outside Temple" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Any Price")).not.toBeInTheDocument();
    expect(screen.queryByText("Under $50")).not.toBeInTheDocument();
  });

  it("renders a search input and category dropdown", () => {
    render(<ServicesPage />);
    expect(screen.getByRole("textbox", { name: /Search services/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Filter by category/i })).toBeInTheDocument();
  });

  it("renders the PDF downloads callout and ServiceAreas section", () => {
    render(<ServicesPage />);
    expect(screen.getByTestId("pdf-downloads")).toBeInTheDocument();
    expect(screen.getByTestId("service-areas")).toBeInTheDocument();
  });

  it("renders service cards from the current sample catalog", () => {
    render(<ServicesPage />);
    expect(screen.getAllByTestId("service-card").length).toBe(
      sampleServices.length
    );
  });

  it("filters cards by search query", () => {
    render(<ServicesPage />);
    const initial = screen.getAllByTestId("service-card").length;
    fireEvent.change(screen.getByRole("textbox", { name: /Search services/i }), {
      target: { value: "Shradham" },
    });
    const after = screen.getAllByTestId("service-card").length;
    expect(after).toBeLessThan(initial);
    expect(after).toBeGreaterThan(0);
  });

  it("shows an empty-state message when no services match the search", () => {
    render(<ServicesPage />);
    fireEvent.change(screen.getByRole("textbox", { name: /Search services/i }), {
      target: { value: "zzzz-no-match-zzzz" },
    });
    expect(screen.getByText(/No services match your search/i)).toBeInTheDocument();
  });

  it("filters by selected category", () => {
    render(<ServicesPage />);
    const select = screen.getByRole("combobox", { name: /Filter by category/i }) as HTMLSelectElement;
    // Pick an arbitrary non-default category value
    const firstRealOption = Array.from(select.options).find((o) => o.value !== "all");
    expect(firstRealOption).toBeTruthy();
    fireEvent.change(select, { target: { value: firstRealOption!.value } });
    expect(select.value).toBe(firstRealOption!.value);
  });
});
